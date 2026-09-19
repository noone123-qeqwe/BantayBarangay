/**
 * scripts/build-apk.js
 * Compiles and packages a 100% valid, installable Android APK for BantayBarangay
 * using the Android SDK build-tools, AAPT, D8, and APKSigner.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DOWNLOADS_DIR = path.join(ROOT_DIR, 'downloads');
const BUILD_DIR = path.join(ROOT_DIR, 'scratch', 'android-build');
const TARGET_APK = path.join(DOWNLOADS_DIR, 'BantayBarangay.apk');

// Ensure correct JAVA_HOME
process.env.JAVA_HOME = 'C:\\Program Files\\Java\\jdk-21';

// Locate Android SDK
const SDK_DIR = path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk');
if (!fs.existsSync(SDK_DIR)) {
  console.error('❌ Android SDK not found at:', SDK_DIR);
  process.exit(1);
}

const BUILD_TOOLS_VERSION = '34.0.0';
const BUILD_TOOLS_DIR = path.join(SDK_DIR, 'build-tools', BUILD_TOOLS_VERSION);
const PLATFORM_JAR = path.join(SDK_DIR, 'platforms', 'android-35', 'android.jar');

const AAPT = path.join(BUILD_TOOLS_DIR, 'aapt.exe');
const D8 = path.join(BUILD_TOOLS_DIR, 'd8.bat');
const ZIPALIGN = path.join(BUILD_TOOLS_DIR, 'zipalign.exe');
const APKSIGNER = path.join(BUILD_TOOLS_DIR, 'apksigner.bat');
const JAVAC = 'C:\\Program Files\\Java\\jdk-21\\bin\\javac.exe';
const KEYTOOL = 'C:\\Program Files\\Java\\jdk-21\\bin\\keytool.exe';
const KEYSTORE = path.join(ROOT_DIR, 'scripts', 'release.keystore');

console.log('🚀 Starting BantayBarangay Native APK Build Process...');
console.log('   • Android SDK:', SDK_DIR);
console.log('   • Build Tools:', BUILD_TOOLS_DIR);
console.log('   • Platform JAR:', PLATFORM_JAR);

// 1. Reset Build Directory
if (fs.existsSync(BUILD_DIR)) {
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BUILD_DIR, { recursive: true });
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

const SRC_DIR = path.join(BUILD_DIR, 'src', 'ph', 'gov', 'masbate', 'bantaybarangay');
const RES_DIR = path.join(BUILD_DIR, 'res', 'drawable');
const ASSETS_DIR = path.join(BUILD_DIR, 'assets', 'www');
const BIN_DIR = path.join(BUILD_DIR, 'bin');
const CLASSES_DIR = path.join(BIN_DIR, 'classes');

fs.mkdirSync(SRC_DIR, { recursive: true });
fs.mkdirSync(RES_DIR, { recursive: true });
fs.mkdirSync(ASSETS_DIR, { recursive: true });
fs.mkdirSync(CLASSES_DIR, { recursive: true });

// 2. Generate Release Keystore if needed
if (!fs.existsSync(KEYSTORE)) {
  console.log('🔑 Generating signing keystore...');
  const genKeyCmd = `"${KEYTOOL}" -genkeypair -v -keystore "${KEYSTORE}" -alias bantaybarangay -keyalg RSA -keysize 2048 -validity 10000 -storepass bantay123456 -keypass bantay123456 -dname "CN=BantayBarangay, OU=Civic, O=Masbate Province, L=Masbate, ST=Bicol, C=PH"`;
  execSync(genKeyCmd, { stdio: 'inherit' });
}

// 3. Write AndroidManifest.xml
const manifestContent = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="ph.gov.masbate.bantaybarangay"
    android:versionCode="520"
    android:versionName="5.2.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="BantayBarangay"
        android:roundIcon="@drawable/ic_launcher"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:label="BantayBarangay"
            android:theme="@android:style/Theme.DeviceDefault.NoActionBar"
            android:configChanges="orientation|keyboardHidden|screenSize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;
fs.writeFileSync(path.join(BUILD_DIR, 'AndroidManifest.xml'), manifestContent, 'utf-8');

// 4. Write MainActivity.java
const javaSource = `package ph.gov.masbate.bantaybarangay;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.GeolocationPermissions;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.view.KeyEvent;
import android.content.Intent;
import android.net.Uri;
import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;

public class MainActivity extends Activity {
    private WebView webView;
    private static final String LIVE_URL = "https://bantaybarangay.onrender.com/resident/auth.html";
    private static final String OFFLINE_URL = "file:///android_asset/www/resident/auth.html";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            String[] perms = new String[]{
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.CAMERA
            };
            boolean needReq = false;
            for (String p : perms) {
                if (checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) {
                    needReq = true;
                    break;
                }
            }
            if (needReq) {
                requestPermissions(perms, 101);
            }
        }

        webView = new WebView(this);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setGeolocationEnabled(true);
        s.setBuiltInZoomControls(false);
        s.setSupportZoom(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);

        webView.setWebChromeClient(new AppChromeClient());
        webView.setWebViewClient(new AppClient(this, OFFLINE_URL));
        webView.loadUrl(LIVE_URL);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}

class AppClient extends WebViewClient {
    private Activity activity;
    private String fallbackUrl;

    public AppClient(Activity act, String fallback) {
        this.activity = act;
        this.fallbackUrl = fallback;
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        String url = request.getUrl().toString();
        if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("sms:")) {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                activity.startActivity(intent);
                return true;
            } catch (Exception e) {
                return false;
            }
        }
        return false;
    }

    @Override
    public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        if (request.isForMainFrame()) {
            view.loadUrl(fallbackUrl);
        }
    }
}

class AppChromeClient extends WebChromeClient {
    @Override
    public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
        callback.invoke(origin, true, false);
    }
}
`;
fs.writeFileSync(path.join(SRC_DIR, 'MainActivity.java'), javaSource, 'utf-8');

// 5. Copy App Icon
const iconSrc = path.join(ROOT_DIR, 'resident', 'images', 'icon-192.png');
if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, path.join(RES_DIR, 'ic_launcher.png'));
}

// 6. Copy Web Assets into assets/www
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'scratch') {
        copyDirRecursive(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirRecursive(path.join(ROOT_DIR, 'resident'), path.join(ASSETS_DIR, 'resident'));
copyDirRecursive(path.join(ROOT_DIR, 'shared'), path.join(ASSETS_DIR, 'shared'));

// 7. Compile Java to Bytecode (.class)
console.log('☕ Compiling Java code to bytecode...');
const javacCmd = `"${JAVAC}" -source 8 -target 8 -bootclasspath "${PLATFORM_JAR}" -d "${CLASSES_DIR}" "${path.join(SRC_DIR, 'MainActivity.java')}"`;
execSync(javacCmd, { stdio: 'inherit' });

// 8. Compile .class to Dalvik Executable (classes.dex) using D8
console.log('🤖 Compiling DEX bytecode using D8...');
const classDir = path.join(CLASSES_DIR, 'ph', 'gov', 'masbate', 'bantaybarangay');
const classFiles = fs.readdirSync(classDir)
  .filter(f => f.endsWith('.class'))
  .map(f => `"${path.join(classDir, f)}"`)
  .join(' ');
const d8Cmd = `"${D8}" --min-api 21 --lib "${PLATFORM_JAR}" --output "${BIN_DIR}" ${classFiles}`;
execSync(d8Cmd, { stdio: 'inherit' });

// 9. Package Resources and compile AndroidManifest.xml to Binary AXML using AAPT
console.log('📦 Compressing assets and generating binary AndroidManifest using AAPT...');
const unalignedApk = path.join(BIN_DIR, 'unaligned.apk');
const aaptPackageCmd = `"${AAPT}" package -f -m -M "${path.join(BUILD_DIR, 'AndroidManifest.xml')}" -S "${path.join(BUILD_DIR, 'res')}" -I "${PLATFORM_JAR}" -F "${unalignedApk}" -A "${path.join(BUILD_DIR, 'assets')}"`;
execSync(aaptPackageCmd, { stdio: 'inherit' });

// 10. Add classes.dex into unaligned.apk
console.log('📥 Embedding classes.dex into APK package...');
const aaptAddCmd = `"${AAPT}" add "${unalignedApk}" classes.dex`;
execSync(aaptAddCmd, { cwd: BIN_DIR, stdio: 'inherit' });

// 11. Zipalign APK (4-byte alignment)
console.log('📐 Aligning APK using zipalign...');
const alignedApk = path.join(BIN_DIR, 'aligned.apk');
if (fs.existsSync(alignedApk)) fs.unlinkSync(alignedApk);
const zipalignCmd = `"${ZIPALIGN}" -f -p 4 "${unalignedApk}" "${alignedApk}"`;
execSync(zipalignCmd, { stdio: 'inherit' });

// 12. Sign APK using apksigner (v1 + v2 + v3 scheme)
console.log('✍️ Signing APK using apksigner...');
if (fs.existsSync(TARGET_APK)) fs.unlinkSync(TARGET_APK);
const apksignerCmd = `"${APKSIGNER}" sign --ks "${KEYSTORE}" --ks-key-alias bantaybarangay --ks-pass pass:bantay123456 --key-pass pass:bantay123456 --out "${TARGET_APK}" "${alignedApk}"`;
execSync(apksignerCmd, { stdio: 'inherit' });

// 13. Verify Signature
console.log('🔍 Verifying APK signature...');
const verifyCmd = `"${APKSIGNER}" verify --verbose "${TARGET_APK}"`;
execSync(verifyCmd, { stdio: 'inherit' });

const stat = fs.statSync(TARGET_APK);
const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);

const apkMeta = {
  appName: "BantayBarangay",
  packageName: "ph.gov.masbate.bantaybarangay",
  version: "5.2.0",
  versionCode: 520,
  minSdk: 21,
  targetSdk: 34,
  file: "BantayBarangay.apk",
  sizeBytes: stat.size,
  sizeFormatted: `${sizeMb} MB`,
  signatureScheme: "v1 + v2 + v3",
  builtAt: new Date().toISOString()
};
fs.writeFileSync(path.join(DOWNLOADS_DIR, 'version.json'), JSON.stringify(apkMeta, null, 2), 'utf-8');

console.log('==========================================================');
console.log(`🎉 GENUINE ANDROID APK BUILT AND SIGNED SUCCESSFULLY!`);
console.log(`📍 File: ${TARGET_APK} (${sizeMb} MB)`);
console.log(`🛡️ Signature: Verified (v1, v2, and v3 schemes valid)`);
console.log('==========================================================');
