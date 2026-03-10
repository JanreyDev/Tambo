process.chdir(__dirname);
process.argv = [process.argv[0], "dev", "--port", "3003"];
require("next/dist/bin/next");
