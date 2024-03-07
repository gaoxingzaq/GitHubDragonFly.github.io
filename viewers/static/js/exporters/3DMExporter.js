( function () {

	/**		!!! Work in progress !!!
	*
	*	- supports exporting textured meshes of the following geometry types:
	*		- Buffer, Sphere, Box, Cylinder, Cone, Icosahedron and maybe some other
	*	- supports exporting Points and LineSegments as well
	*
	*	Usage:
	*
	*		Import rhino module in your application:
	*
	*			<script src="https://cdn.jsdelivr.net/npm/rhino3dm@8.4.0/rhino3dm.js" defer></script>
	*
	*		Construct the exporter and parse the scene:
	*
	*			const exporter = new THREE.Rhino3dmExporter( manager );
	*
	*			exporter.parse( scene, function( arrayBuffer ) {
	*				let blob = new Blob( [ arrayBuffer ], { type: 'application/octet-stream' } );
	*
	*				let link = document.createElement( 'a' );
	*				link.style.display = 'none';
	*				document.body.appendChild( link );
	*				link.href = URL.createObjectURL( blob );
	*				URL.revokeObjectURL( blob );
	*				link.download = 'Model.3dm';
	*				link.click();
	*				document.body.removeChild( link );
	*			}
	*
	*	Optional full format: exporter.parse( scene, onDone, onError, options );
	*
	*		options = { vertexColorsCorrection: 32, exportLineSegments: false, lineSegmentsRotateX: Math.PI / 2 };
	*		options = { vertexColorsCorrection: 0, maxTextureSize: 1024, map_flip_required: true };
	*
	*			vertexColorsCorrection	[ default = 0 ]	-	can improve the look of vertex colors in some formats
	*														value from range [ 0, 128 ]
	*
	*			exportLineSegments	[ default = true ]	-	mainly intended for exporting from LDRAW format
	*
	*			lineSegmentsRotateX	[ default = 0 ]		- 	angle in radians to rotate LineSegments over X-Axis
	*														has no effect if exportLineSegments is set to false
	*														mainly intended for exporting from LDRAW format
	*
	*			maxTextureSize	[ default = Infinity ]	-	scale exported textures down / up
	*
	*			map_flip_required	[ default = false ]	-	Y-flip exported textures
	*														compressed textures seem to require this flip
	*
	*/

	class Rhino3dmExporter {

		constructor( manager ) {

			this.manager = manager || THREE.DefaultLoadingManager;

			if ( typeof rhino3dm === 'undefined' ) {

				throw Error( 'THREE.3DMLoader: External library rhino3dm.js required.' );

			}

		}

		async parse( scene, onDone, onError, options = {} ) {

			const scope = this;

			const Module = await rhino3dm();

			const rhino_file = new Module.File3dm();

			const defaultOptions = {
				vertexColorsCorrection: 0,
				exportLineSegments: true,
				lineSegmentsRotateX: 0,
				map_flip_required: false,
				maxTextureSize: Infinity
			};

			options = Object.assign( defaultOptions, options );

			const vertexColorsCorrection = Math.max( 0, Math.min( 128, options.vertexColorsCorrection ) );
			const exportLineSegments = options.exportLineSegments;
			const lineSegmentsRotateX = options.lineSegmentsRotateX;
			const map_flip_required = options.map_flip_required;
			const maxTextureSize = options.maxTextureSize;

			let rhino_object, rhino_material, rhino_attributes, geometry_clone, mesh_matrix4;

			const processed_images = {};

			let rhino_count = 0, points_count = 0;

			function process_material( material, isArrayMember = false ) {

				rhino_material = new Module.Material();
				rhino_material.default();

				if ( material.name && material.name !== '' ) {

					rhino_material.name = material.name;

				} else {

					rhino_material.name = 'material_' + rhino_count;

				}

				if ( material.color ) {

					rhino_material.diffuseColor = {
						r: material.color.r * 255.0,
						g: material.color.g * 255.0,
						b: material.color.b * 255.0,
						a: 255
					};

					rhino_attributes.drawColor = {
						r: material.color.r * 255.0,
						g: material.color.g * 255.0,
						b: material.color.b * 255.0,
						a: 255
					};

					rhino_attributes.plotColor = {
						r: material.color.r * 255.0,
						g: material.color.g * 255.0,
						b: material.color.b * 255.0,
						a: 255
					};

				}

				if ( material.emissive ) {

					rhino_material.emissionColor = {
						r: material.emissive.r * 255.0,
						g: material.emissive.g * 255.0,
						b: material.emissive.b * 255.0,
						a: 255
					};

				}

				if ( material.specular ) {

					rhino_material.specularColor = {
						r: material.specular.r * 255.0,
						g: material.specular.g * 255.0,
						b: material.specular.b * 255.0,
						a: 255
					};

				}

				if ( material.opacity !== undefined ) {

					if ( material.transparent === true ) {

						rhino_material.transparency = material.opacity === 1 ? 0.0001 : 1.0 - material.opacity;

					} else {

						rhino_material.transparency = 1.0 - material.opacity;

					}

				}

				if ( material.shininess !== undefined ) rhino_material.shine = material.shininess;
				if ( material.reflectivity !== undefined ) rhino_material.reflectivity = material.reflectivity;
				if ( material.flatShading !== undefined ) rhino_material.disableLighting = material.flatShading;
				if ( material.refractionFactor !== undefined ) rhino_material.indexOfRefraction = material.refractionFactor;

				if ( material.type === 'MeshStandardMaterial' || material.type === 'MeshPhysicalMaterial' ) {

					rhino_material.toPhysicallyBased();

					if ( material.metalness !== undefined ) rhino_material.physicallyBased().metallic = material.metalness;
					if ( material.roughness !== undefined ) rhino_material.physicallyBased().roughness = material.roughness;

					if ( material.sheen !== undefined )
						rhino_material.physicallyBased().sheen = material.sheen;

					if ( material.thickness !== undefined )
						rhino_material.physicallyBased().subsurface = material.thickness;

					if ( material.transmission !== undefined )
						rhino_material.physicallyBased().opacity = 1 - material.transmission;

					if ( material.color ) {

						rhino_material.physicallyBased().baseColor = {
							r: material.color.r * 255.0,
							g: material.color.g * 255.0,
							b: material.color.b * 255.0,
							a: 255
						};

					}

					if ( material.specularColor ) {

						rhino_material.specularColor = {
							r: material.specularColor.r * 255.0,
							g: material.specularColor.g * 255.0,
							b: material.specularColor.b * 255.0,
							a: 255
						};

					}

					if ( material.specularIntensity !== undefined )
						rhino_material.physicallyBased().specular = material.specularIntensity;

					if ( material.ior !== undefined ) rhino_material.indexOfRefraction = material.ior;

					if ( material.anisotropy !== undefined ) {

						rhino_material.physicallyBased().anisotropic = material.anisotropy;

						if ( material.anisotropyRotation !== undefined )
							rhino_material.physicallyBased().anisotropicRotation = material.anisotropyRotation;

					}

					if ( material.clearcoat !== undefined ) {

						rhino_material.physicallyBased().clearcoat = material.clearcoat;

						if ( material.clearcoatRoughness !== undefined )
							rhino_material.physicallyBased().clearcoatRoughness = material.clearcoatRoughness;

					}

				}

				rhino_file.materials().add( rhino_material );

				rhino_attributes.materialSource = Module.ObjectMaterialSource.MaterialFromObject;
				rhino_attributes.materialIndex = rhino_count;

				// Pass additional material parameters as a user string

				const params = {};

				if ( isArrayMember === true ) params.isArrayMember = true;

				params.side = material.side;

				if ( material.alphaTest !== undefined && material.alphaTest > 0 )
					params.alphaTest = material.alphaTest;

				if ( material.bumpScale !== undefined && material.bumpScale !== 1 )
					params.bumpScale = material.bumpScale;

				if ( material.emissiveIntensity !== undefined && material.emissiveIntensity !== 1 )
					params.emissiveIntensity = material.emissiveIntensity;

				if ( material.normalMapType !== undefined && material.normalMapType !== 0 )
					params.normalMapType = material.normalMapType;

				if ( material.normalScale !== undefined ) {

					if ( material.normalScale.x !== 1 ) params.normalScaleX = material.normalScale.x;
					if ( material.normalScale.y !== 1 ) params.normalScaleY = material.normalScale.y;

				}

				if ( material.clearcoatNormalScale !== undefined ) {

					if ( material.clearcoatNormalScale.x !== 1 ) params.clearcoatNormalScaleX = material.clearcoatNormalScale.x;
					if ( material.clearcoatNormalScale.y !== 1 ) params.clearcoatNormalScaleY = material.clearcoatNormalScale.y;

				}

				if ( material.iridescence !== undefined )
					params.iridescence = material.iridescence;

				if ( material.iridescenceIOR !== undefined )
					params.iridescenceIOR = material.iridescenceIOR;

				if ( material.iridescenceThicknessRange !== undefined ) {

					params.iridescenceThicknessRangeX = material.iridescenceThicknessRange[ 0 ];
					params.iridescenceThicknessRangeY = material.iridescenceThicknessRange[ 1 ];

				}

				if ( material.attenuationDistance && material.attenuationDistance !== Infinity )
					params.attenuationDistance = material.attenuationDistance;

				if ( material.attenuationColor ) {

					params.attenuationColorR = material.attenuationColor.r * 255.0;
					params.attenuationColorG = material.attenuationColor.g * 255.0;
					params.attenuationColorB = material.attenuationColor.b * 255.0;

				}

				if ( material.sheenRoughness !== undefined )
					params.sheenRoughness = material.sheenRoughness;

				if ( material.sheenColor ) {

					params.sheenColorR = material.sheenColor.r * 255.0;
					params.sheenColorG = material.sheenColor.g * 255.0;
					params.sheenColorB = material.sheenColor.b * 255.0;

				}

				rhino_attributes.setUserString( 'params_' + rhino_file.materials().get( rhino_count ).id, JSON.stringify( params ) );

				// A workaround for exporting textures as strings

				function add_texture( texture, map_type ) {

					if ( texture.name === '' ) texture.name = map_type;

					let tex = {};
					tex.type = map_type;
					tex.uuid = texture.uuid;

					texture = texture.clone();

					tex.center = texture.center;
					tex.offset = texture.offset;
					tex.repeat = texture.repeat;
					tex.rotation = texture.rotation;
					tex.minFilter = texture.minFilter;
					tex.magFilter = texture.magFilter;
					tex.mapping = texture.mapping ? texture.mapping : 300;

					if ( texture.wrapS ) tex.wrapU = texture.wrapS === 1000 ? 0 : 1;
					if ( texture.wrapT ) tex.wrapV = texture.wrapT === 1000 ? 0 : 1;

					tex.image = map_type;

					// Pass image as a user string

					if ( ! processed_images[ texture.uuid ] ) {

						if ( texture.isCompressedTexture === true ) {

							texture = scope.decompress( texture, maxTextureSize );

						}

						const image_url = scope.imageURLfromTexture( texture, true, maxTextureSize, map_flip_required );
						if ( image_url ) processed_images[ tex.uuid ] = image_url;

					}

					// Pass the whole texture as a user string

					rhino_attributes.setUserString( rhino_file.materials().get( rhino_count ).id + '_' + map_type, JSON.stringify( tex ) );

				}

				if ( material.type === 'MeshStandardMaterial' || material.type === 'MeshPhysicalMaterial' ) {

					if ( material.map ) add_texture( material.map, 'PBR_BaseColor' );
					if ( material.aoMap ) add_texture( material.aoMap, 'PBR_AmbientOcclusion' );
					if ( material.alphaMap ) add_texture( material.alphaMap, 'PBR_Alpha' );
					if ( material.bumpMap ) add_texture( material.bumpMap, 'Bump' );
					if ( material.emissiveMap ) add_texture( material.emissiveMap, 'PBR_Emission' );
					if ( material.anisotropyMap ) add_texture( material.anisotropyMap, 'PBR_Anisotropic' );
					if ( material.clearcoatMap ) add_texture( material.clearcoatMap, 'PBR_Clearcoat' );
					if ( material.clearcoatNormalMap ) add_texture( material.clearcoatNormalMap, 'PBR_ClearcoatBump' );
					if ( material.clearcoatRoughnessMap ) add_texture( material.clearcoatRoughnessMap, 'PBR_ClearcoatRoughness' );
					if ( material.displacementMap ) add_texture( material.displacementMap, 'PBR_Displacement' );
					if ( material.metalnessMap ) add_texture( material.metalnessMap, 'PBR_Metallic' );
					if ( material.roughnessMap ) add_texture( material.roughnessMap, 'PBR_Roughness' );
					if ( material.sheenColorMap ) add_texture( material.sheenColorMap, 'PBR_Sheen' );
					if ( material.specularColorMap ) add_texture( material.specularColorMap, 'PBR_Specular' );
					if ( material.transmissionMap ) add_texture( material.transmissionMap, 'Opacity' );
					if ( material.thicknessMap ) add_texture( material.thicknessMap, 'PBR_Subsurface' );
					if ( material.normalMap ) add_texture( material.normalMap, 'PBR_Other_Normal' );
					if ( material.anisotropyMap ) add_texture( material.anisotropyMap, 'PBR_Other_Anisotropy' );
					if ( material.iridescenceMap ) add_texture( material.iridescenceMap, 'PBR_Other_Iridescence' );
					if ( material.iridescenceThicknessMap ) add_texture( material.iridescenceThicknessMap, 'PBR_Other_IridescenceThickness' );
					if ( material.sheenColorMap ) add_texture( material.sheenColorMap, 'PBR_Other_SheenColor' );
					if ( material.sheenRoughnessMap ) add_texture( material.sheenRoughnessMap, 'PBR_Other_SheenRoughness' );
					if ( material.specularIntensityMap ) add_texture( material.specularIntensityMap, 'PBR_Other_SpecularIntensity' );

				} else {

					if ( material.map ) add_texture( material.map, 'Diffuse' );
					if ( material.alphaMap ) add_texture( material.alphaMap, 'Transparency' );
					if ( material.bumpMap ) add_texture( material.bumpMap, 'Bump' );
					if ( material.envMap ) add_texture( material.envMap, 'Emap' );

				}

				rhino_count ++;

			}

			function parse_objects() {

				scene.traverse( function ( object ) {

					function cumulative_matrix_check( parent, mesh_in_mesh = false ) {

						if ( parent && ( parent.type === 'Group' || parent.type === 'Object3D' || mesh_in_mesh === true ) ) {

							mesh_matrix4 = mesh_matrix4.premultiply( parent.matrix );

							cumulative_matrix_check( parent.parent, ( parent.isMesh && parent.parent && parent.parent.isMesh ) );

						}	

					}

					if ( object.isMesh || object.isPoints || object.isLine || object.isLineSegments ) {

						rhino_attributes = new Module.ObjectAttributes();

						geometry_clone = scope.interleaved_buffer_attribute_check( object.geometry.clone() );

						mesh_matrix4 = new THREE.Matrix4().copy( object.matrix );

						cumulative_matrix_check( object.parent, ( object.isMesh && object.parent && object.parent.isMesh ) );

						if ( geometry_clone.matrixAutoUpdate ) geometry_clone.updateMatrix();
						if ( geometry_clone.matrix === undefined ) geometry_clone.matrix = new THREE.Matrix4();

						geometry_clone.matrix.premultiply( mesh_matrix4 );

						if ( geometry_clone.position === undefined ) geometry_clone.position = new THREE.Vector3();
						if ( geometry_clone.quaternion === undefined ) geometry_clone.quaternion = new THREE.Quaternion();
						if ( geometry_clone.scale === undefined ) geometry_clone.scale = new THREE.Vector3();

						geometry_clone.matrix.decompose( geometry_clone.position, geometry_clone.quaternion, geometry_clone.scale );

						// Geometry groups don't seem to get processed so pass them as a user string

						if ( geometry_clone.groups )
							rhino_attributes.setUserString( 'geometry_groups', JSON.stringify( geometry_clone.groups ) );

					}

					if ( object.isMesh || object.isLine || object.isLineSegments ) {

						if ( object.isMesh ) {

							rhino_object = new Module.Mesh.createFromThreejsJSON( { data: geometry_clone } );

						} else if ( ( object.isLine || object.isLineSegments ) && exportLineSegments === true ) {

							const curvePoints = new Module.Point3dList();

							for ( let i = 0; i < geometry_clone.attributes.position.array.length; i += 3 ) {

								curvePoints.add(
									geometry_clone.attributes.position.array[ i ],
									geometry_clone.attributes.position.array[ i + 1 ],
									geometry_clone.attributes.position.array[ i + 2 ]
								);

							}

							rhino_object = new Module.PolylineCurve( curvePoints );

							if ( lineSegmentsRotateX !== 0 ) {

								// Rotation params: angle, axis, rotation point

								let xform = Module.Transform.rotation( lineSegmentsRotateX, [ 1, 0, 0 ], [ 0, 0, 0 ] );
								rhino_object.transform( xform );

							}

						}

						// Add Vertex Colors as red / green / blue Uint8 values 0 - 255

						if ( geometry_clone.attributes && geometry_clone.attributes.color ) {

							let geometry_color_array = geometry_clone.attributes.color.array;
							let dataAsUint8Array = new Uint8Array( geometry_clone.attributes.color.array.length );

							for ( let i = 0; i < dataAsUint8Array.length; i ++ ) {

								let tmp = Math.max( -1, Math.min( 1, geometry_color_array[ i ] ) );
								tmp = tmp < 0 ? ( tmp * 0x8000 ) : ( tmp * 0x7FFF );
								tmp = tmp / 256;
								dataAsUint8Array[ i ] = tmp + vertexColorsCorrection;

							}

							if ( ( object.isLine || object.isLineSegments ) && exportLineSegments === true ) {

								// Pass LineSegments vertex colors as a user string

								let color_array = '';

								for ( let j = 0; j < dataAsUint8Array.length; j += geometry_clone.attributes.color.itemSize ) {

									color_array += dataAsUint8Array[ j ] + ',' + dataAsUint8Array[ j + 1 ] + ',' + dataAsUint8Array[ j + 2 ] + ',';

								}

								rhino_attributes.setUserString( 'colors', color_array.slice( 0, -1 ) );

							} else {

								for ( let j = 0; j < dataAsUint8Array.length; j += geometry_clone.attributes.color.itemSize ) {

									rhino_object.vertexColors().add( dataAsUint8Array[ j ], dataAsUint8Array[ j + 1 ], dataAsUint8Array[ j + 2 ] );

								}

							}

						}

						if ( Array.isArray( object.material ) ) {

							for ( const material of object.material ) {

								if ( object.isLine || object.isLineSegments ) {

									if ( exportLineSegments === true ) {

										process_material( material.clone(), object.material.length > 1 );
										rhino_file.objects().add( rhino_object, rhino_attributes );

									}

								} else {

									process_material( material.clone(), object.material.length > 1 );
									rhino_file.objects().add( rhino_object, rhino_attributes );

								}

							}

						} else {

							if ( object.isLine || object.isLineSegments ) {

								if ( exportLineSegments === true ) {

									process_material( object.material.clone() );
									rhino_file.objects().add( rhino_object, rhino_attributes );

								}

							} else {

								process_material( object.material.clone() );
								rhino_file.objects().add( rhino_object, rhino_attributes );

							}

						}

					} else if ( object.isPoints ) {

						rhino_object = new Module.PointCloud();

						// Add Vertex Colors as red / green / blue Uint8 values 0 - 255

						if ( geometry_clone.attributes && geometry_clone.attributes.color ) {

							let geometry_color_array = geometry_clone.attributes.color.array;
							let dataAsUint8Array = new Uint8Array( geometry_clone.attributes.color.array.length );

							for ( let i = 0; i < dataAsUint8Array.length; i ++ ) {

								let tmp = Math.max( -1, Math.min( 1, geometry_color_array[ i ] ) );
								tmp = tmp < 0 ? ( tmp * 0x8000 ) : ( tmp * 0x7FFF );
								tmp = tmp / 256;
								dataAsUint8Array[ i ] = tmp + vertexColorsCorrection;

							}

							let geometry_position_array = geometry_clone.attributes.position.array;

							for ( let j = 0; j < dataAsUint8Array.length; j += geometry_clone.attributes.color.itemSize ) {

								let location = [ geometry_position_array[ j ], geometry_position_array[ j + 1 ], geometry_position_array[ j + 2 ] ];

								let point_color = {
									r: dataAsUint8Array[ j ],
									g: dataAsUint8Array[ j + 1 ],
									b: dataAsUint8Array[ j + 2 ],
									a: 255
								};

								let point_cloud_item = rhino_object.insertNew( points_count );

								point_cloud_item.location = location;
								point_cloud_item.color = point_color;

								points_count ++;

							}

						} else {

							let rhino_material = new Module.Material();
							rhino_material.default();

							if ( material.name && material.name !== '' ) {

								rhino_material.name = material.name;

							} else {

								rhino_material.name = 'material_' + rhino_count;

							}

							if ( material.color ) {

								let point_color = {
									r: material.color.r * 255.0,
									g: material.color.g * 255.0,
									b: material.color.b * 255.0,
									a: 255
								};

								geometry_position_array = geometry_clone.attributes.position.array;

								for ( let j = 0; j < geometry_position_array.length; j += geometry_clone.attributes.position.itemSize ) {

									let location = [
										geometry_position_array[ j ],
										geometry_position_array[ j + 1 ],
										geometry_position_array[ j + 2 ]
									];

									let point_cloud_item = rhino_object.insertNew( points_count );

									point_cloud_item.location = location;
									point_cloud_item.color = point_color;

									points_count ++;

								}

								rhino_material.diffuseColor = point_color;

							}

							if ( material.opacity ) rhino_material.transparency = 1.0 - material.opacity;

							rhino_file.materials().add( rhino_material );

							rhino_attributes.materialSource = Module.ObjectMaterialSource.MaterialFromObject;
							rhino_attributes.materialIndex = rhino_count;

							rhino_count ++;

						}

						rhino_file.objects().add( rhino_object, rhino_attributes );

					}

				} );

			}

			parse_objects();

			if ( rhino_count === 0 && points_count === 0 ) {

				if ( typeof onError === 'function' ) {

					onError( 'THREE.3DMExporter: No qualifying objects found!' );
					return null;

				} else {

					throw new Error( 'THREE.3DMExporter: No qualifying objects found!' );

				}

			} else {

				// Pass each image as a user string

				Object.keys( processed_images ).forEach(  key => {

					rhino_file.strings().set( key, processed_images[ key ] );

				});

				if ( typeof onDone === 'function' ) {

					onDone( rhino_file.toByteArray() );

				} else {

					return rhino_file.toByteArray();

				}

			}

		}

		// decompress function is from TextureUtils.js

		decompress( texture, maxTextureSize = Infinity, renderer = null ) {

			let _renderer;
			let fullscreenQuadGeometry;
			let fullscreenQuadMaterial;
			let fullscreenQuad;

			if ( ! fullscreenQuadGeometry ) fullscreenQuadGeometry = new THREE.PlaneGeometry( 2, 2, 1, 1 );
			if ( ! fullscreenQuadMaterial ) fullscreenQuadMaterial = new THREE.ShaderMaterial( {
				uniforms: { blitTexture: new THREE.Uniform( texture ) },
				vertexShader: `
					varying vec2 vUv;
					void main(){
						vUv = uv;
						gl_Position = vec4(position.xy * 1.0,0.,.999999);
					}`,
				fragmentShader: `
					uniform sampler2D blitTexture; 
					varying vec2 vUv;
		
					void main(){ 
						gl_FragColor = vec4(vUv.xy, 0, 1);
						
						#ifdef IS_SRGB
						gl_FragColor = LinearTosRGB( texture2D( blitTexture, vUv) );
						#else
						gl_FragColor = texture2D( blitTexture, vUv);
						#endif
					}`
			} );

			fullscreenQuadMaterial.uniforms.blitTexture.value = texture;
			fullscreenQuadMaterial.defines.IS_SRGB = texture.colorSpace == THREE.SRGBColorSpace;
			fullscreenQuadMaterial.needsUpdate = true;

			if ( ! fullscreenQuad ) {

				fullscreenQuad = new THREE.Mesh( fullscreenQuadGeometry, fullscreenQuadMaterial );
				fullscreenQuad.frustrumCulled = false;

			}

			const _camera = new THREE.PerspectiveCamera();
			const _scene = new THREE.Scene();
			_scene.add( fullscreenQuad );

			if ( ! renderer ) {

				renderer = _renderer = new THREE.WebGLRenderer( { antialias: false } );

			}

			renderer.setSize( Math.min( texture.image.width, maxTextureSize ), Math.min( texture.image.height, maxTextureSize ) );
			renderer.clear();
			renderer.render( _scene, _camera );

			const readableTexture = new THREE.Texture( renderer.domElement );

			readableTexture.minFilter = texture.minFilter;
			readableTexture.magFilter = texture.magFilter;
			readableTexture.wrapS = texture.wrapS;
			readableTexture.wrapT = texture.wrapT;
			readableTexture.name = texture.name;

			if ( _renderer ) {

				_renderer.dispose();
				_renderer = null;

			}

			return readableTexture;

		}

		// deinterleaveAttribute function is from BufferGeometryUtils.js

		deinterleaveAttribute( attribute ) {

			const cons = attribute.data.array.constructor;
			const count = attribute.count;
			const itemSize = attribute.itemSize;
			const normalized = attribute.normalized;

			const array = new cons( count * itemSize );

			let newAttribute;

			if ( attribute.isInstancedInterleavedBufferAttribute ) {

				newAttribute = new THREE.InstancedBufferAttribute( array, itemSize, normalized, attribute.meshPerAttribute );

			} else {

				newAttribute = new THREE.BufferAttribute( array, itemSize, normalized );

			}

			for ( let i = 0; i < count; i ++ ) {

				newAttribute.setX( i, attribute.getX( i ) );

				if ( itemSize >= 2 ) {

					newAttribute.setY( i, attribute.getY( i ) );

				}

				if ( itemSize >= 3 ) {

					newAttribute.setZ( i, attribute.getZ( i ) );

				}

				if ( itemSize >= 4 ) {

					newAttribute.setW( i, attribute.getW( i ) );

				}

			}

			return newAttribute;

		}

		deinterleave( geometry, attribute = 'color' ) {

			const attr = geometry.attributes[ attribute ];
			const itemSize = attr.itemSize;
			const offset = attr.offset;

			const data = attr.data;

			if ( data === undefined ) return [];

			let iBA = new THREE.InterleavedBufferAttribute( data, itemSize, offset );

			let attr_items = this.deinterleaveAttribute( iBA );

			let temp_array = [];

			for ( let i = 0, l = attr_items.array.length; i < l; i ++ ) {

				temp_array[ i ] = attr_items.array[ i ] === NaN ? 0 : attr_items.array[ i ]; // avoid NaN values

			}

			return new THREE.BufferAttribute( new Float32Array( temp_array ), itemSize, false );

		}

		interleaved_buffer_attribute_check( geo ) {

			const attribute_array = [ 'position', 'normal', 'color', 'tangent', 'uv', 'uv1', 'uv2', 'uv3' ];

			for (const attribute of attribute_array) {

				if ( geo.attributes[ attribute ] && geo.attributes[ attribute ].isInterleavedBufferAttribute ) {

					if ( geo.attributes[ attribute ].data ) {

						if ( geo.attributes[ attribute ].data.array ) {

							let geometry_attribute_array = this.deinterleave( geo, attribute );

							geo.deleteAttribute( attribute );
							geo.setAttribute( attribute, geometry_attribute_array );

						}

					}

				}

			}

			return geo;

		}

		// Reference: https://discourse.threejs.org/t/save-load-a-texture-with-alpha-component/23526/11

		imageURLfromTexture( texture, retain_alpha = true, maxTextureSize, map_flip_required = false ) {

			const image = texture.image;

			if ( image !== undefined ) {

				if ( /^data:/i.test( image.src ) ) {

					return image.src;

				}

				const _canvas = document.createElementNS( 'http://www.w3.org/1999/xhtml', 'canvas' );

				_canvas.width = Math.min( image.width, maxTextureSize );
				_canvas.height = Math.min( image.height, maxTextureSize );

				const ctx = _canvas.getContext( '2d' );

				if ( map_flip_required === true ) {

					// Flip image vertically

					ctx.translate( 0, _canvas.height );
					ctx.scale( 1, - 1 );

				}

				// this seems to also work fine for exporting TGA images as PNG

				if ( image instanceof ImageData ) {

					ctx.putImageData( image, 0, 0 );

				} else if ( image.data && image.data.constructor === Uint8Array ) {

					let imgData = new ImageData( new Uint8ClampedArray( image.data ), image.width, image.height );

					ctx.putImageData( imgData, 0, 0 );

				} else {

					ctx.drawImage( image, 0, 0, _canvas.width, _canvas.height );

				}

				if ( ( _canvas.width > 2048 || _canvas.height > 2048 ) && ( ! retain_alpha ) ) {

					return _canvas.toDataURL( 'image/jpeg' , 0.6 );

				} else {

					return _canvas.toDataURL( 'image/png' );

				}

			} else {

				return null;

			}

		}

	}

	THREE.Rhino3dmExporter = Rhino3dmExporter;

} )();
