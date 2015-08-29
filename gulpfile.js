/* globals require */
var gulp  = require("gulp");
var gutil = require("gulp-util");

var paths = {
    js: [ "src/*.js", "src/**/*.js" ]
};

gulp.task("watch", [ "build" ], function() {
    gulp.watch(paths.js, [ "build" ]);
});

gulp.task("build", [ "build-bundle", "build-docs" ]);

gulp.task("build-bundle", function () {
    var browserify = require("browserify");
    var source     = require("vinyl-source-stream");
    var buffer     = require("vinyl-buffer");
    var uglify     = require("gulp-uglify");
    var rename     = require("gulp-rename");
    var ngAnnotate = require("gulp-ng-annotate");
    var debowerify = require("debowerify");
    // set up the browserify instance on a task basis
    var b = browserify({
        entries: "./src/bills.js",
        debug: true
    })
        .transform(debowerify);

    return b.bundle()
        .pipe(source("bills.bundle.js"))
        .pipe(buffer())
        .pipe(ngAnnotate())
        .on("error", gutil.log)
        .pipe(gulp.dest("./www/compiled/"))
        .pipe(uglify())
        .pipe(rename({ suffix: ".min" }))
        .pipe(gulp.dest("./www/compiled/"));
});

gulp.task("build-docs", function() {
    var ngDocs = require("gulp-ngdocs");

    var options = {
        scripts: [
            "./www/compiled/bills.bundle.js"
        ],
        html5Mode: false,
        title: "Bills"
    };

    return gulp.src("./src/**/*.js")
        .pipe(ngDocs.process(options))
        .pipe(gulp.dest("./docs"));
});

gulp.task("jshint", function () {
    var jshint = require("gulp-jshint");

    return gulp.src(paths.js)
        .pipe(jshint())
        .pipe(jshint.reporter())
        .pipe(jshint.reporter("fail"));
});

function bump(importance) {
    // get all the files to bump version in 
    return gulp.src(["./package.json", "./bower.json"])
        // bump the version number in those files 
        .pipe(require("gulp-bump")({type: importance}))
        // save it back to filesystem 
        .pipe(gulp.dest("./"))
        // commit the changed version number 
        .pipe(
            require("gulp-git")
                .commit(
                    "Chore: bump package " + importance + " version from " +
                        require("./package.json").version
                )
        )
 
        // read only one file to get the version number 
        .pipe(require("gulp-filter")("package.json"))
        // **tag it in the repository** 
        .pipe(require("gulp-tag-version")());
}

[ "patch", "minor", "major" ]
    .forEach(function(level) {
        gulp.task(level, [ "build", "no-uncommitted-changes" ], bump.bind(null, level));
    });

gulp.task("no-uncommitted-changes", function(cb) {
    return require("gulp-git").status({args: '--porcelain'}, function(err, stdout) {
        if (stdout.toString().length) {
            throw new Error("There are uncommitted changes - commit your changes and try again.");
        }
        cb();
    });
});
