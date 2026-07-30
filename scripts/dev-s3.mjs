import S3rver from "s3rver";
import fs from "fs";

const dir = "./.s3rver-data";
fs.mkdirSync(dir, { recursive: true });

new S3rver({
  port: 9000,
  address: "127.0.0.1",
  silent: false,
  directory: dir,
  configureBuckets: [{ name: "auftragsapp" }],
}).run(() => {
  console.log("Lokaler S3-Mock (s3rver) läuft auf 127.0.0.1:9000, Bucket 'auftragsapp' angelegt");
});
