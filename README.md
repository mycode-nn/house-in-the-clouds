# House in the Clouds

An interactive 3D miniature world featuring a flying house and garden. Visitors can rotate and zoom the scene, explore story details, switch scenes, and save a portrait image. The interface supports English, French, and Chinese; English is the default.

**Live demo:** https://up-house-garden-2026.pleasantcider16.chatgpt.site/

## Run locally

Serve the `dist` directory with any static file server. For example:

```sh
python3 -m http.server 8000 --directory dist
```

Then open http://127.0.0.1:8000/ in a browser. The project uses Three.js modules bundled in `dist/vendor` and needs no build step.

## Controls

- Drag to rotate; scroll or pinch to zoom.
- Select points of interest to explore details around the house and garden.
- Use the scene menu to change the atmosphere, or save a portrait image.
