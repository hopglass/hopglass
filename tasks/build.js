module.exports = function(grunt) {
  grunt.config.merge({
    nodedir: "node_modules",
    copy: {
      html: {
        options: {
          process: function (content) {
            return content.replace("#revision#", grunt.option("gitRevision"))
          }
        },
        src: ["*.html"],
        expand: true,
        cwd: "html/",
        dest: "build/"
      },
      img: {
        src: ["img/*"],
        expand: true,
        dest: "build/"
      },
      vendorjs: {
        src: ["es6-shim/es6-shim.min.js",
          "es6-shim/es6-shim.map"],
        expand: true,
        cwd: "node_modules/",
        dest: "build/vendor/"
      },
      robotoSlab: {
        src: [ "fonts/*",
               "roboto-slab-fontface.css"
             ],
        expand: true,
        dest: "build/",
        cwd: "node_modules/roboto-slab-fontface"
      },
      roboto: {
        src: [ "fonts/*",
               "roboto-fontface.css"
             ],
        expand: true,
        dest: "build/",
        cwd: "node_modules/roboto-fontface"
      },
      ionicons: {
        src: [ "fonts/*",
               "css/ionicons.min.css"
             ],
        expand: true,
        dest: "build/",
        cwd: "node_modules/ionicons/"
      },
      leafletImages: {
        src: [ "images/*" ],
        expand: true,
        dest: "build/",
        cwd: "node_modules/leaflet/dist/"
      }
    },
    sass: {
      options: {
        sourceMap: true,
        outputStyle: "compressed",
        implementation: require("dart-sass")
      },
      dist: {
        files: {
          "build/style.css": "scss/main.scss"
        }
      }
    },
    postcss: {
      options: {
        map: true,
        processors: [
          require("autoprefixer")({
            browsers: ["last 2 versions"]
          })
        ]
      },
      dist: {
        src: "build/style.css"
      }
    },
    cssmin: {
      target: {
        files: {
          "build/style.css": [ "node_modules/leaflet/dist/leaflet.css",
                               "node_modules/leaflet-label/dist/leaflet.label.css",
                               "style.css"
                             ]
        }
      }
    },
    requirejs: {
      compile: {
        options: {
          baseUrl: "lib",
          name: "../node_modules/almond/almond",
          mainConfigFile: "app.js",
          include: "../app",
          wrap: true,
          optimize: "uglify",
          out: "build/app.js"
        }
      }
    }
  })

  grunt.loadNpmTasks("grunt-contrib-copy")
  grunt.loadNpmTasks("grunt-contrib-requirejs")
  grunt.loadNpmTasks("grunt-sass")
  grunt.loadNpmTasks("grunt-postcss")
}
