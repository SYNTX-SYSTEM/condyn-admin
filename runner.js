const { exec } = require("child_process");
exec("npx tsx test-pdf.ts", (error, stdout, stderr) => {
  console.log("STDOUT:", stdout);
  console.error("STDERR:", stderr);
  if (error) process.exit(1);
});
