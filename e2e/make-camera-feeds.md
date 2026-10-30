# Fake-camera feeds for the camera tests

`e2e/camera.spec.ts` replaces the browser camera with a video of a real person, so MediaPipe runs on real frames.
The `.y4m` files are ~40 MB each and are not committed; make them with ffmpeg (any build, e.g. `npx ffmpeg-static`):

```bash
ffmpeg -ss 1 -t 6 -i public/hero/1236.mp4 -vf "scale=480:640:force_original_aspect_ratio=decrease,pad=480:640:(ow-iw)/2:(oh-ih)/2,fps=15" -pix_fmt yuv420p e2e/fixtures/body.y4m
ffmpeg -ss 0.5 -t 5 -i https://assets.mixkit.co/videos/4508/4508-720.mp4 -vf "scale=640:480:force_original_aspect_ratio=increase,crop=640:480,fps=15" -pix_fmt yuv420p e2e/fixtures/face.y4m
```

Without them the camera tests are skipped; the upload test (`body-3.jpg`) still runs.
Clips: Mixkit free licence (body: clip 1236, face: clip 4508).
