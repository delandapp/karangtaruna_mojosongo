const https = require("https");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");

const PACKAGES = [
  { name: "@tailwindcss/postcss", version: "4.0.0-beta.8" },
  { name: "tailwindcss", version: "4.0.0-beta.8" },
  { name: "@tailwindcss/node", version: "4.0.0-beta.8" },
  { name: "@tailwindcss/oxide", version: "4.0.0-beta.8" },
];

async function downloadAndExtract(pkgName, version) {
  const isScoped = pkgName.startsWith("@");
  const scope = isScoped ? pkgName.split("/")[0] : "";
  const name = isScoped ? pkgName.split("/")[1] : pkgName;
  const cacheDir = path.join(__dirname, ".npm-cache");

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const unpkgUrl = `https://registry.npmjs.org/${pkgName}/-/${name}-${version}.tgz`;
  const tgzPath = path.join(cacheDir, `${name}-${version}.tgz`);

  console.log(`Downloading ${pkgName}@${version}...`);

  return new Promise((resolve, reject) => {
    https
      .get(unpkgUrl, (res) => {
        if (res.statusCode === 302) {
          https
            .get(res.headers.location, (redirectRes) => {
              const fileStream = fs.createWriteStream(tgzPath);
              redirectRes.pipe(fileStream);
              fileStream.on("finish", () => resolve(tgzPath));
            })
            .on("error", reject);
        } else if (res.statusCode === 200) {
          const fileStream = fs.createWriteStream(tgzPath);
          res.pipe(fileStream);
          fileStream.on("finish", () => resolve(tgzPath));
        } else {
          reject(
            new Error(`Failed to download: ${res.statusCode} ${unpkgUrl}`),
          );
        }
      })
      .on("error", reject);
  }).then((tgzPath) => {
    console.log(`Extracting ${pkgName}...`);
    const targetDir = path.join(__dirname, "node_modules", pkgName);
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    fs.mkdirSync(targetDir, { recursive: true });

    // Use tar to extract
    try {
      const posixTgzPath = tgzPath.replace(/\\/g, "/");
      const posixTargetDir = targetDir.replace(/\\/g, "/");
      execSync(
        `tar --force-local -xf "${posixTgzPath}" -C "${posixTargetDir}" --strip-components=1`,
      );
      console.log(`Successfully extracted ${pkgName}`);
    } catch (e) {
      console.error(`Failed to extract ${pkgName}:`, e.message);
    }
  });
}

async function main() {
  for (const pkg of PACKAGES) {
    try {
      await downloadAndExtract(pkg.name, pkg.version);
    } catch (e) {
      console.error(e);
    }
  }
}

main();
