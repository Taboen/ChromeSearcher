module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'), 
        uncss: {
            dist: {
                files: {
                    'build/css/style.css':['src/search_box.html', 'src/results.html']
                }
            },
            options: {
                ignore:["#linkToTaburl",".searchResultsTemplate",".page-header",".results",".result-item",'.found','.h2','.h1','h4','.h2 small','h2','small','a','h2 small'],
                stylesheets: ["src/lib/css/bootstrap.css", "src/lib/css/customize_bootstrap.css"] 
            }
        },
        processhtml: {
            dist: {
                files: {
                    'build/search_box.html':['src/search_box.html'],
                    'build/results.html':['src/results.html'],
                    'build/lib/mustache.js':['src/lib/mustache.js'],
                    'build/lib/zepto.js':['src/lib/zepto.js'] 
                }
            }
        },
        uglify: {
            my_target: {
                files: {
                'build/content_script.js': ['src/content_script.js'],
                'build/results.js':['src/results.js'],
                'build/search_box.js':['src/search_box.js']
                }
            }
        },
        removelogging: {
            dist: {
                src: ["src/content_script.js",'src/results.js','src/search_box.js']
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-uncss');
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-remove-logging');
    grunt.registerTask('default',['uncss','processhtml','removelogging','uglify']);
}
