# n8n-nodes-teamtoken

An [n8n](https://n8n.io) community node for **TeamToken** — one API key for image
and video generation across 51 models (Nano Banana, GPT Image, Grok Image, Veo,
Kling, Seedance, and more). No per-provider setup, no infrastructure.

[Installation](#installation) · [Credentials](#credentials) ·
[Operations](#operations) · [Video polling](#video-polling)

## Installation

Follow the n8n [community node installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

In n8n: **Settings → Community Nodes → Install**, then enter
`n8n-nodes-teamtoken`.

## Credentials

Create a **TeamToken API** credential:

| Field | Default | Notes |
| --- | --- | --- |
| **API Key** | — | Your teamToken key (the same one used for text, image and video). |
| **Base URL** | `https://api.teamtoken.store` | Gateway that serves the `/v1` media routes. May be entered with or without a trailing `/v1` — both work. |
| **Model Catalog URL** | `https://app.teamtoken.store/cabinet/api/public/media-models` | Public catalog used to populate the model dropdowns. Lives on a different host than the API, so it is its own field. |

The credential test calls `GET /v1/models` — a valid key returns `200`, an
invalid one `401`.

## Operations

### Image

- **Generate** — `POST /v1/images/generations`. Prompt → image(s). Options:
  aspect ratio, resolution, number of images (1–10), reference images
  (image-to-image / character consistency).
- **Edit** — `POST /v1/images/edits`. Same as Generate but oriented around
  reference images.
- **Get Job** — `GET /v1/images/jobs/{id}`. Fetch an asynchronous job.

Returned images are base64. By default the node decodes each into a **binary
attachment** (property `data`); turn off *Return Images as Binary* to get the raw
JSON instead.

> Image results live for **7 days**, then the bytes move to cold storage and
> `Get Job` returns `archived: true` with an empty `data`. Save images as soon as
> you receive them.

### Video

- **Generate** — `POST /v1/videos`. Prompt (+ optional image / video inputs for
  image-to-video, video-to-video and motion control) → video.
- **Extend** — `POST /v1/videos/extend`. Continue a previous video job (by its
  ID) into a longer clip.
- **Get Job** — `GET /v1/videos/{id}`. Fetch an asynchronous job.

A finished video is returned as a streaming URL served through the gateway.
Enable *Download Video* to fetch the MP4 bytes into a binary attachment.

## Video polling

Video generation takes seconds to minutes, so the node **submits the job and
polls its status endpoint** until it completes or fails, up to *Max Wait
(Seconds)*, checking every *Poll Interval (Seconds)*. Because the gateway's
status route returns `200` for both completed and failed jobs, a failed
generation surfaces as a clean node error rather than an opaque HTTP 5xx.

Disable *Wait for Completion* to return the job ID immediately and fetch the
result later with a **Get Job** node — useful when you want to hand polling to a
Wait/loop of your own, or run many jobs in parallel.

## Example workflows

Import the ready-made flows from [`workflows/`](workflows):

- `teamtoken-image-generation.json`
- `teamtoken-video-generation.json`

## Compatibility

Requires n8n with `n8nNodesApiVersion` 1 (Node.js ≥ 20.15). No runtime
dependencies — all HTTP goes through n8n's built-in request helper.

## License

[MIT](LICENSE)
