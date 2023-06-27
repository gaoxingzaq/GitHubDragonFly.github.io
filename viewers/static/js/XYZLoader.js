( function () {

	/*
		Three.js XYZ Loader supports XYZ and XYZRGB models that include space as a delimiter.

		The following document provided a link to example models that include semicolon as a delimiter
		which appears to be used in python:

		https://orbi.uliege.be/bitstream/2268/254933/1/TDS_generate_3D_meshes_with_python.pdf (document)
		https://drive.google.com/drive/folders/1Ih_Zz9a6UcbUlaA-puEB_is7DYvXrb4w?usp=sharing (example models)

		Modifications here do provide for a simple visualization of these models.
		Normals array is also included as the document suggested its use in python.
	*/

	class XYZLoader extends THREE.Loader {

		load( url, onLoad, onProgress, onError ) {

			const scope = this;
			const loader = new THREE.FileLoader( this.manager );
			loader.setPath( this.path );
			loader.setRequestHeader( this.requestHeader );
			loader.setWithCredentials( this.withCredentials );
			loader.load( url, function ( text ) {

				try {

					onLoad( scope.parse( text ) );

				} catch ( e ) {

					if ( onError ) {

						onError( e );

					} else {

						console.error( e );

					}

					scope.manager.itemError( url );

				}

			}, onProgress, onError );

		}

		parse( text ) {

			const lines = text.split( '\n' );

			const color = new THREE.Color();
			const vertices = [];
			const colors = [];
			const normals = [];

			for ( let line of lines ) {

				line = line.trim();

				if ( line.startsWith( '#' ) || line.startsWith( '//' ) ) continue; // skip comments

				if ( line.indexOf( ';' ) > -1 ) {

					const lineValues = line.split( ';' );

					// XYZ

					vertices.push( parseFloat( lineValues[ 0 ] ) );
					vertices.push( parseFloat( lineValues[ 1 ] ) );
					vertices.push( parseFloat( lineValues[ 2 ] ) );

				} else {

					const lineValues = line.split( /\s+/ );

					if ( lineValues.length === 3 ) {

						// XYZ

						vertices.push( parseFloat( lineValues[ 0 ] ) );
						vertices.push( parseFloat( lineValues[ 1 ] ) );
						vertices.push( parseFloat( lineValues[ 2 ] ) );

					}

					if ( lineValues.length === 6 ) {

						// XYZRGB

						vertices.push( parseFloat( lineValues[ 0 ] ) );
						vertices.push( parseFloat( lineValues[ 1 ] ) );
						vertices.push( parseFloat( lineValues[ 2 ] ) );

						const r = parseFloat( lineValues[ 3 ] ) / 255;
						const g = parseFloat( lineValues[ 4 ] ) / 255;
						const b = parseFloat( lineValues[ 5 ] ) / 255;

						color.set( r, g, b ).convertSRGBToLinear();

						colors.push( color.r, color.g, color.b );

					}

					if ( lineValues.length === 9 ) {

						// Normals
						normals.push( parseFloat( lineValues[ 6 ] ) );
						normals.push( parseFloat( lineValues[ 7 ] ) );
						normals.push( parseFloat( lineValues[ 8 ] ) );

					}

				}

			}

			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

			if ( colors.length > 0 ) {

				geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

			}

			if ( normals.length > 0 ) {

				geometry.setAttribute( 'normals', new THREE.Float32BufferAttribute( normals, 3 ) );

			}

			return geometry;

		}

	}

	THREE.XYZLoader = XYZLoader;

} )();
