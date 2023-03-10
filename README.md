# GitHubDragonFly.github.io
GitHubDragonFly's Website - access it [here](https://githubdragonfly.github.io).

Designed to serve as a hub with links to repositories, Number Type Converter and FREE online [three.js](https://threejs.org) based 3D model viewers.
Fit for a desktop but should be functional on mobile devices in spite of its tiny or bulky appearance. 

GitHub servers are providing correct access to files, so cloning or downloading this repository will not have the same functionality if run locally without some server.

Repositories do contain projects in several different programming languages or a mix of: `Java` `VB.Net` `C#` `python` `JavaScript` `jQuery` `HTML/CSS` `shell`.

There is a lot of information and descriptions, some intended for Industrial Automation and some for general/personal use. All is good as an educational resource as well.

# Mozilla Firefox screenshot

Main Menu Page
![Start Page](images/screenshot.png?raw=true)

# Notes about Number Type Converter

- Appears to be fully functional (binary, hex, octal, signed/unsigned integers 8/16/32/64/128-bit, float 32/64-bit)
- This is an online version of the Windows App found [here](https://github.com/GitHubDragonFly/NumberConversion) so check its description
- An open mind and some knowledge of number systems, hopefully binary, will help understand the displayed values
- Possibly of good use to those who deal with Programmable Logic Controllers (PLC) and students
- Note about float parser: it will complete parsing the string as a number if it encounters an invalid character as per standard number rules

Number Type Converter
![Number Type Converter](images/Number%20Type%20Converter.png?raw=true)

# Notes about three.js 3D Model Viewers

- They are functional `AS THEY ARE` and intended for viewing a single 3D model
- Menu with controls can be located either on top or on the bottom of the page
- All viewers include [Orbit Controls Gizmo](https://github.com/Fennec-hub/ThreeOrbitControlsGizmo) for orientation
- Most viewers, if not all, have been tested as functional in the latest Firefox / Chrome / Edge / Safari browsers - do note that Safari might be finicky about certain features
- Import files locally from a file browser dialog or specify remote URL (make any necessary changes on your device to allow local file browsing)
- Import formats, where applicable, with any optional/required textures:
  - 3DS, 3DM, 3MF, AMF, BRP, BREP, DAE, FBX, IFC, IGES, IGS, JSON, OBJ + MTL, PCD, PDB, PLY, VTK, VTP, STL, STEP, STP, PRWM, WRL
  - GLTF supported formats: GLB, GLTF + BIN, DRC
  - GCODE supported formats: GCODE, NCC, NGC
  - LDRAW supported formats: DAT, L3B, LDR, MPD
  - MMD ( Miku Miku Dance ) supported formats: PMD, PMX, VMD, VPD, SPA, SPH, MP3, OGG
- Export formats, where applicable:
  - 3DM, DAE, APNG, GIF, GLB, GLTF, JSON, OBJ + MTL, PLY, STL, PRWM
- 3DM exports are powered by [rhino3dm](https://github.com/mcneel/rhino3dm)
- PRWM exports are powered by [PRWM](https://github.com/kchapelier/PRWM)
  - as per the author: OBJ -> PRWM conversion is limited to OBJ containing a single model made of triangles
- GIF export is actually Animated GIF based on mrdoob's [example](https://github.com/mrdoob/omggif-example) and is using [omggif](https://github.com/deanm/omggif) library:
  - currently set to 500 x 500 size in the centre of the window
  - the approximate GIF area rectangle will be shown during the GIF generation
  - if the model leaves this area during the GIF generation, due to its motion, the process might error out
  - the larger the model and/or the more colors in the model will affect the size/quality of the resulting GIF file
  - it disregards the background color but does observe the background image with simple color palette
  - consider changing Directional Light color and/or using Ambient Light to avoid poor quality GIF for some models
  - non-animated / non-rotating models will spin 360 degrees
  - see the `legobrick` generated GIF examples and their optimized / resized version in the `images` folder
- Animated PNG (APNG) exports are powered by [UPNG.js](https://github.com/photopea/UPNG.js) and [Pako.js](https://github.com/nodeca/pako)
  - almost the same features as in the Animated GIF export, see above
  - use some background image to avoid visual anomalies (artifacts) in the resulting file due to transparency:
    - where applicable, use the `Eq` checkbox to apply equirectangular scene background
    - where applicable, use the `G` button to add grayish linear gradient as a scene background
    - use `black.gif` `white.gif` `dark_blue.png` files found in the `images` folder as a simple choice for background image
  - see the `legobrick` generated (A)PNG example and its optimized / resized version in the `images` folder
  - currently set for Lossy PNG to speed up processing but with a comment on how to change it to full color if required
- JSON import/export is actually three.js created format:
  - JSON Legacy viewer is using r124 of three.js to support legacy THREE.Geometry
  - JSON Viewer is using r135 of three.js
- The best choice of loading 3D models is via the viewers `URL` option (for URLs with no CORS restrictions)
- Multiple comma separated URLs are allowed in some viewers and can be from mixed websites
- See `URLS4MODELS.md` file for examples as well as [HTML_CSS_JS_Flask](https://github.com/GitHubDragonFly/HTML_CSS_JS_Flask) repository
- Lots of loading instructions in the [HTML_CSS_JS](https://github.com/GitHubDragonFly/HTML_CSS_JS) repository
- When loading files locally from a hard drive:
  - All files have to be in the same folder
  - Some viewers might have some limitations
  - Possibly update your models to look for textures in the same folder
- Buttons, where applicable:
  - `A` - animations
  - `E` - edges
  - `F` - flatShading
  - `G` - linear gradient background (OBJ, PLY+STL viewers)
  - `K` - kinematics (DAE viewer)
  - `L` - lines (LDRAW and its exports in GLTF, OBJ, JSON viewers)
  - `O` - opacity
  - `P` - poses (MMD viewer)
  - `S` - skeleton (JSON viewers)
  - `T` - textures
  - `V` - variants (GLTF viewer)
  - `X` - morphs
  - `CS` - construction step (LDRAW viewer)
  - `MP` - material - Phong (MP), Standard (MS), Lambert (ML)
    - `*` - applicable to MS to provide envMap + metalness (VTK, PRWM viewers)
  - `OS` - material side - Original (OS), Front (FS), Back (BS), Double (DS)
  - `VC` - vertex colors
    - `!` - random vertex colors
  - `XS` - xtra smooth
  - `RST` - reset
  - `#` - grid
- Light controls, where applicable:
  - `AL` - ambient light
  - `DL` - directional light
  - `HL` - hemisphere light
  - `SL` - spotlight
  - `DLi` - directional light intensity
  - `SLi` - spotlight intensity
- Other controls, where applicable:
  - `C` - object color
  - `BG` - background color
  - `Eq` - equirectangular background
    - `R` - reflectivity (envMap + metalness)
- STEP / IGES / BREP Viewer is using [occt-import-js](https://github.com/kovacsv/occt-import-js)
- JSON Viewer has timeouts which might need to be adjusted when loading large files
- GLTF / FBX / DAE viewers will also export animations to JSON format
- DAE (Collada) exporter appears to brighten up the original model as well as the exported model
- MMD / GLTF viewers can export to DAE (Collada) / OBJ formats but all exported textures seem to need to be flipped vertically afterwards (use some paint program for this)
- GLTF / GLB exporter has a limitation related to shader material, seen when exporting MMD models
- Using Animated GIF as a texture is experimental and powered by modified [gif-loader](https://github.com/movableink/three-gif-loader) using [omggif](https://github.com/deanm/omggif) library
    - currently available only in `FBX` `OBJ` `PLY+STL` `PRWM` viewers and should be tried on simple models
    - see the Animated GIF of a cube using Animated GIF as a texture in the `images` folder
- Tips:
  - if the model is correctly loaded but you cannot see it then try any or all of the following:
    - apply `edges`
    - zoom `in/out` or apply `Scale`
    - apply `flatShading`
    - apply `Vertex Colors`
    - change `ambient light` to white
    - change `background color` to white
  - exporting some models might be better done using multiple viewers, for example MMD -> OBJ and then OBJ -> JSON might be better than straight MMD -> JSON export
  - experiment with all exporters available by exporting the original model as well as its exported versions
  - large resolution textures should be scaled down before loading, as an example download [`Bedroom`](https://casual-effects.com/data/index.html) with 8k images and try it as is and then scale them down to 2k (which seems to be optimal for browsers)
  - `Lambert` material does not have flatShading functionality
  - you could also try using [COLLADA2GLTF](https://github.com/KhronosGroup/COLLADA2GLTF) and [FBX2glTF](https://github.com/facebookincubator/FBX2glTF) and [Online 3D Viewer](https://3dviewer.net) exporters/converters

PLY Viewer
![PLY Viewer](images/PLY%20Viewer.png?raw=true)

# Notes about three.js Texture Viewer

- Supporting PNG, APNG, JPG, JPEG, JFIF, PJPEG, PJP, BMP, DIB, GIF, TIF, TIFF, WEBP, TGA, SVG, DDS, KTX, KTX2, EXR, BASIS and Lottie JSON texture files as well as MP4 / WEBM / OGV video files
- Animated GIF file support is powered in part by [omggif](https://github.com/deanm/omggif) and displayed with [THREE.CSS2DRenderer](https://threejs.org/docs/#examples/en/renderers/CSS2DRenderer)
- Animated PNG file support is powered in part by [UPNG.js](https://github.com/photopea/UPNG.js) and displayed with [THREE.CSS2DRenderer](https://threejs.org/docs/#examples/en/renderers/CSS2DRenderer)
- Animated WEBP file is displayed with [THREE.CSS2DRenderer](https://threejs.org/docs/#examples/en/renderers/CSS2DRenderer)
- All of the above animated files are "view only" so most viewer controls will not have any effect and will be disabled
- TIF / TIFF image file support is powered by [UTIF.js](https://github.com/photopea/UTIF.js)
- Use the `T` button to switch between textures
- Texture is displayed on a rotatable plane - rotation / move / zoom are not applicable to Animated GIF / PNG / WEBP files
- Video player has its own controls for playback and full-screen switching
- URL text box also allows entering a single base64 string of the image data, see the `URLS4MODELS.md` file for an example
- For certain formats and their manipulation an easy alternative to this viewer would be `https://ezgif.com`
- Just remember that most of these files can easily be viewed with some operating system applications or by the browsers themselves (like animated GIF/PNG/WEBP or MP4/WEBM/OGV videos), all it takes in Windows, for example, is to right-click the file itself and choose `Open With` and select `Firefox` browser 

![Texture Viewer](images/Texture%20Viewer.png?raw=true)

# License

This is all MIT licensed but please observe any other licenses that might be applicable to some files or content.

# Trademarks

Any and all trademarks, either directly or indirectly mentioned in this project, belong to their respective owners.
