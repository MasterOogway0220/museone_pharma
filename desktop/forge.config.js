module.exports = {
  packagerConfig: { asar: true, name: "MuseOne Pharma" },
  makers: [
    { name: "@electron-forge/maker-squirrel", config: { name: "museone_pharma" } },
    { name: "@electron-forge/maker-zip", platforms: ["win32"] },
  ],
};
