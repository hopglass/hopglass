module.exports = function (grunt) {
  grunt.config.merge({
    checkDependencies: {
      options: {
        install: true
      },
      bower: {
        options: {
          packageManager: "bower"
        }
      },
      npm: {}
    },
    eslint: {
      options: {
        extends: [
          "defaults/configurations/eslint"
	],
        rules: {
          "semi": [2, "always"],
          "no-undef": 0
        }
      },
      sources: {
        src: ["app.js", "!Gruntfile.js", "lib/**/*.js"]
      },
      grunt: {
        src: ["Gruntfile.js", "tasks/*.js"]
      }
    }
  });

  grunt.loadNpmTasks("grunt-check-dependencies");
  grunt.loadNpmTasks("grunt-eslint");
};
