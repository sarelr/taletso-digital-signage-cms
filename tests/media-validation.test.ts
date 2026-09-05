import assert from "node:assert/strict";
import test from "node:test";
import { maxMediaBytes, validateMediaFile } from "../src/lib/media.ts";

test("recognizes PNG by signature rather than extension", async () => {
  const file = new File([new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0])], "renamed.txt", { type:"text/plain" });
  const media = await validateMediaFile(file);
  assert.equal(media.mimeType, "image/png"); assert.equal(media.extension, ".png");
});

test("rejects executable SVG content", async () => {
  const file = new File(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], "bad.svg", { type:"image/svg+xml" });
  await assert.rejects(() => validateMediaFile(file), /executable/);
});

test("rejects unsupported data", async () => {
  const file = new File(["not media"], "document.pdf", { type:"application/pdf" });
  await assert.rejects(() => validateMediaFile(file), /Unsupported/);
});

test("recognizes JPEG, WEBP and MP4 by their signatures", async () => {
  const jpeg = await validateMediaFile(new File([new Uint8Array([0xff,0xd8,0xff,0xe0])], "photo.bin"));
  const webp = await validateMediaFile(new File([new Uint8Array([0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x45,0x42,0x50])], "image.bin"));
  const mp4 = await validateMediaFile(new File([new Uint8Array([0,0,0,0x18,0x66,0x74,0x79,0x70])], "video.bin"));
  assert.equal(jpeg.mimeType, "image/jpeg");
  assert.equal(webp.mimeType, "image/webp");
  assert.equal(mp4.mimeType, "video/mp4");
});

test("accepts a non-executable SVG", async () => {
  const media = await validateMediaFile(new File(['<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>'], "safe.svg"));
  assert.equal(media.mimeType, "image/svg+xml");
});

test("rejects empty and oversized files before reading their contents", async () => {
  await assert.rejects(() => validateMediaFile(new File([], "empty.png")), /between 1 byte and 100 MB/);
  const oversized = { name: "large.mp4", size: maxMediaBytes + 1, arrayBuffer: () => { throw new Error("must not read"); } } as unknown as File;
  await assert.rejects(() => validateMediaFile(oversized), /between 1 byte and 100 MB/);
});
