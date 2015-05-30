/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.OBJExporter = function () {};

function findFaceForVertIndex(index, faces) {
	for (var i = 0; i < faces.length; i++) {
		var face = faces[i]
		if (face.a == index || face.b == index || face.c == index )
			return face;
	}
}

THREE.OBJExporter.prototype = {

	constructor: THREE.OBJExporter,

	// colors: https://github.com/mrdoob/three.js/issues/6025
	parse: function ( object, numVertices, numFaces ) {

		var output = '';

		var indexVertex = 0;
		var indexVertexUvs = 0
		var indexNormals = 0;

		var parseObject = function ( child ) {

			var nbVertex = 0;
			var nbVertexUvs = 0;
			var nbNormals = 0;

			var geometry = child.geometry;

			numVertices = numVertices || geometry.vertices.length;
			numFaces = numFaces || geometry.faces.length;

			if ( geometry instanceof THREE.Geometry ) {
				output += 'o ' + child.name + '\n';

				for ( var i = 0, l = numVertices; i < l; i ++ ) {

					var vertex = geometry.vertices[ i ].clone();
					vertex.applyMatrix4( child.matrixWorld );

					// Added vertex coloring (non standard .obj)
					var face = findFaceForVertIndex(i, geometry.faces)
					if (face) {
						var c = face.color
						output += 'v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z + ' ' + c.r + ' ' + c.g + ' ' + c.b + '\n';
					}
					else {
						output += 'v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z + '\n';
					}

					nbVertex ++;

				}

				// uvs

				for ( var i = 0, l = geometry.faceVertexUvs[ 0 ].length; i < l; i ++ ) {

					var vertexUvs = geometry.faceVertexUvs[ 0 ][ i ];

					for ( var j = 0; j < vertexUvs.length; j ++ ) {

						var uv = vertexUvs[ j ];
						vertex.applyMatrix4( child.matrixWorld );

						output += 'vt ' + uv.x + ' ' + uv.y + '\n';

						nbVertexUvs ++;

					}

				}

				// normals

				for ( var i = 0, l = numFaces; i < l; i ++ ) {

					var normals = geometry.faces[ i ].vertexNormals;

					for ( var j = 0; j < normals.length; j ++ ) {

						var normal = normals[ j ];
						output += 'vn ' + normal.x + ' ' + normal.y + ' ' + normal.z + '\n';

						nbNormals ++;

					}

				}

				// faces

				for ( var i = 0, j = 1, l = numFaces; i < l; i ++, j += 3 ) {

					var face = geometry.faces[ i ];

					output += 'f ';
					output += ( indexVertex + face.a + 1 ) + '/' + ( indexVertexUvs + j ) + '/' + ( indexNormals + j ) + ' ';
					output += ( indexVertex + face.b + 1 ) + '/' + ( indexVertexUvs + j + 1 ) + '/' + ( indexNormals + j + 1 ) + ' ';
					output += ( indexVertex + face.c + 1 ) + '/' + ( indexVertexUvs + j + 2 ) + '/' + ( indexNormals + j + 2 ) + '\n';

				}

			}

			// update index
			indexVertex += nbVertex;
			indexVertexUvs += nbVertexUvs;
			indexNormals += nbNormals;

		};

		object.traverse( parseObject );

		return output;

	}

};
