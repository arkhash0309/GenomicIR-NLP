# Demo assets

Drop screenshots and a screen recording here so the main `README.md` renders them.

The README already references these filenames — add the files and they light up:

| File | What to capture |
|---|---|
| `demo.gif` | A short (10–20s) screen recording of `/ask`: type a question, watch the reasoning trace stream and the D3 graph grow, then the final cited answer. This is the hero — make it count. |
| `ask.png` | A clean still of the `/ask` page mid-answer (trace + live graph). |
| `search.png` | The `/search` results with reranked papers. |
| `graph.png` | The `/explore` knowledge-graph view. |

## Tips for a good demo GIF

- Record at a modest window size (~1280×800) so the file stays small.
- Keep it under ~8 MB so it loads quickly on GitHub.
- Tools: [LICEcap](https://www.cockos.com/licecap/), [Kap](https://getkap.co/),
  [ScreenToGif](https://www.screentogif.com/), or `ffmpeg` to convert a screen capture.
- Convert an `.mp4` to an optimized `.gif`:
  ```bash
  ffmpeg -i recording.mp4 -vf "fps=12,scale=820:-1:flags=lanczos" -loop 0 demo.gif
  ```
