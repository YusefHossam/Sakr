import path from "node:path";

// The browser camera is replaced by a video of a real person (see e2e/make-camera-feeds.md),
// so MediaPipe runs on real frames: the whole on-device pipeline is tested, not a mock.
export const feed = (name: string) => path.resolve("e2e/fixtures", name); // tests run from the project root
export const fakeCamera = (file: string) => ({
  permissions: ["camera"],
  launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-video-capture=${feed(file)}`] },
});
