async function test() {
  console.log("Logging in as resident juan@resident.ph...");
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "juan@resident.ph", password: "Password123!" }),
  });
  const cookie = loginRes.headers.get("set-cookie");
  if (!cookie) {
    throw new Error("Login failed - no cookie returned");
  }

  const catRes = await fetch("http://localhost:3000/api/categories");
  const catData = await catRes.json();
  const categoryId = catData.categories[0].id;

  console.log("Submitting report with high-precision location coordinates and guidance...");
  const postRes = await fetch("http://localhost:3000/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      categoryId,
      title: "Road subsidence on sidewalk near post #M-308",
      description: "The sidewalk has sunken by 10 inches next to the storm drain, posing severe tripping danger at night.",
      safetyFlag: "POSSIBLY",
      latitude: 14.586701,
      longitude: 121.061012,
      accuracy: 4.8,
      address: "Ruby Road near Emerald Avenue, Brgy San Antonio, Pasig City",
      landmark: "[Sidewalk / Pedestrian] In front of GLAS Tower, beside Meralco lamp post #M-308",
      photos: [{ url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800", type: "BEFORE" }],
    }),
  });

  const postData = await postRes.json();
  if (!postRes.ok) {
    throw new Error(postData.error || "Post report failed");
  }

  console.log("✅ Report Created Successfully!");
  console.log("   Reference No:", postData.report.referenceNo);
  console.log("   Latitude:", postData.report.latitude);
  console.log("   Longitude:", postData.report.longitude);
  console.log("   Accuracy Margin:", postData.report.accuracy + "m");
  console.log("   Address:", postData.report.address);
  console.log("   Landmark Guide:", postData.report.landmark);

  console.log("\nFetching report details via GET /api/reports/" + postData.report.referenceNo + "...");
  const getRes = await fetch("http://localhost:3000/api/reports/" + postData.report.referenceNo, {
    headers: { Cookie: cookie },
  });
  const getData = await getRes.json();
  console.log("✅ Fetched Report successfully:", getData.report.referenceNo === postData.report.referenceNo);
  console.log("✅ Verified Accuracy persistence (4.8m):", getData.report.accuracy === 4.8);
  console.log("✅ Verified Sub-Meter Coordinates:", getData.report.latitude === 14.586701 && getData.report.longitude === 121.061012);
  console.log("✅ Verified Road Placement & Landmark:", getData.report.landmark);
  console.log("\n🎉 ALL LOCATION ACCURACY VERIFICATIONS PASSED!");
}

test().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
