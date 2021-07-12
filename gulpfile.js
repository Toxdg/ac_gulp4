var gulp = require('gulp');
var runSequence = require('run-sequence');
var fs = require('fs');
var watch = require('gulp-watch');
// scss/css 
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var sass = require('gulp-sass')(require('sass'));
// js
var concat = require('gulp-concat');
var minify = require('gulp-minify');
var uglify = require('gulp-uglify');
// FTP
var gutil = require( 'gulp-util' );  
var ftp = require( 'vinyl-ftp' );


// General Settings
var mainSettings= {
    themeName: 'ac_theme', // wordpress theme name
    baseDir: 'wp-content/themes/ac_theme/', // main path
    cssDir: 'wp-content/themes/ac_theme/', // css path
    jsVendor: 'vendor.js', // vendor js file name
    jsCommon: 'main.js', // main js file name
    jsAjaxF: 'ajax_front.js', // ajax front js file name 
    jsAjaxA: 'ajax_admin.js', // ajax admin js file name 
    scssDir: 'src/', // source dir name
	FtpWatchInterval: 3000, // ftp watch interval [ms]
    FtpDirName: '/', // ftp dev path
    FtpLogin: '', // ftp dev login
    FtpPassw: '', // fpt dev password
    FtpHost: '', // ftp dev host
    FtpPort: 21, // ftp dev port
    FtpDir_Client: '/', // ftp client path
    FtpLogin_Client: '', // ftp client login
    FtpPassw_Client: '', // ftp client password
    FtpHost_Client: '', // ftp client host
    FtpPort_Client: 21 // ftp client port
}

//
// JS
//

// join and generate main js
gulp.task('js-main', function() {
  return gulp.src(mainSettings.baseDir+'src/js/main/*.js')
    .pipe(concat(mainSettings.jsCommon))
    .pipe(gulp.dest(mainSettings.baseDir+'src/js/'));
});

// join and generate vandor js
gulp.task('js-vendor', function() {
  return gulp.src(mainSettings.baseDir+'src/js/vendor/*.js')
    .pipe(concat(mainSettings.jsVendor))
    .pipe(gulp.dest(mainSettings.baseDir+'src/js/'));
});

// join and generate ajax-front js
gulp.task('js-ajax_front', function() {
  return gulp.src(mainSettings.baseDir+'src/js/ajax_front/*.js')
    .pipe(concat(mainSettings.jsAjaxF))
    .pipe(gulp.dest(mainSettings.baseDir+'src/js/'));
});

// join and generate ajax-admin js
gulp.task('js-ajax_admin', function() {
  return gulp.src(mainSettings.baseDir+'src/js/ajax_admin/*.js')
    .pipe(concat(mainSettings.jsAjaxA))
    .pipe(gulp.dest(mainSettings.baseDir+'src/js/'));
});

// minify geerated js file
gulp.task('js-minify', function(done) {
  gulp.src(mainSettings.baseDir+'src/js/*.js')
    .pipe(minify({
        ext:{
            src:'-debug.js',
            min:'.js'
        },
        exclude: ['tasks'],
        ignoreFiles: ['.combo.js', '-min.js']
    }))
	.pipe(uglify())
    .pipe(gulp.dest(mainSettings.baseDir+'js/'));
    done();
});

//
// SCSS / CSS
//

//scss task
gulp.task('sass', function () {
    return gulp.src(mainSettings.baseDir+mainSettings.scssDir+'scss/*.scss')
      .pipe(sourcemaps.init())
      .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
      .pipe(autoprefixer(['last 4 versions', '> 1%', 'ie 8', 'ie 7'], {cascade: false}))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(mainSettings.cssDir));
});


//
// Task's
//

// generate js files
gulp.task('generate_js',gulp.series('js-main','js-vendor','js-ajax_front', 'js-ajax_admin', 'js-minify'), function(done){
    done();
});


//gulp.task('build', gulp.series('src_celan'));
// cleaner task
gulp.task('src_clean', function (done) {
    try {
        fs.unlinkSync(mainSettings.baseDir+'src/js/main.js');
        fs.unlinkSync(mainSettings.baseDir+'src/js/vendor.js');
        fs.unlinkSync(mainSettings.baseDir+'src/js/ajax_front.js');
        fs.unlinkSync(mainSettings.baseDir+'src/js/ajax_admin.js');
    } catch(err) {
        console.error(err);
    }
    done();
});

// all watch task
gulp.task('all-watch', function (done) {
    console.log('all watch run');
    //gulp.watch(mainSettings.baseDir+mainSettings.scssDir+'scss/*.scss', sass );
    // SCSS / CSS
    gulp.watch(mainSettings.baseDir+mainSettings.scssDir+'scss/*.scss', gulp.series('sass'));
    // JS
    gulp.watch(mainSettings.baseDir+'src/js/main/*.js', gulp.series('js-main'));
    gulp.watch(mainSettings.baseDir+'src/js/vendor/*.js', gulp.series('js-vendor'));
    gulp.watch(mainSettings.baseDir+'src/js/ajax_front/*.js', gulp.series('js-ajax_front'));
    gulp.watch(mainSettings.baseDir+'src/js/ajax_admin/*.js', gulp.series('js-ajax_admin'));
    
    gulp.watch(mainSettings.baseDir+'src/js/*.js', gulp.series('js-minify'));
    
});

// Run Task
gulp.task('_START',gulp.series('src_clean', 'generate_js', 'sass', 'all-watch'));


//
// FTP
//

// var for ftp
var localFilesGlob = ['wp-content/themes/'+mainSettings.themeName+'/**/*','wp-content/plugins/**/*'];  // local dirs theme + plugins
var remoteFolder = '/'+mainSettings.FtpDirName; // remote dir
function getFtpConnection($type = 'dev') {
    // settings for dev
    if($type == 'dev'){
        return ftp.create({
            host: mainSettings.FtpHost,
            port: mainSettings.FtpPort,
            user: mainSettings.FtpLogin,
            password: mainSettings.FtpPassw,
            parallel: 5,
            log: gutil.log
        });
    }
    // settings for client/public
    if($type == 'public'){
        return ftp.create({
            host: mainSettings.FtpHost_Client,
            port: mainSettings.FtpPort_Client,
            user: mainSettings.FtpLogin_Client,
            password: mainSettings.FtpPassw_Client,
            parallel: 5,
            log: gutil.log
        });
    }
}

// send files to dev
gulp.task('ftp-deploy-dev', function() {
    var conn = getFtpConnection('dev');
    return gulp.src(localFilesGlob, { base: '.', buffer: false })
        .pipe( conn.newer( remoteFolder ) ) // only upload newer files 
        .pipe( conn.dest( remoteFolder ) )
    ;
});
// send files to dev - watcher
gulp.task('ftp-deploy-watch', function() {
    var conn = getFtpConnection('dev');
    gulp.watch(localFilesGlob, { interval: mainSettings.FtpWatchInterval }).on('change', function(fileName) { 
        console.log('Changes detected! Uploading file "' + fileName);
        return gulp.src( [fileName], { base: '.', buffer: false } )
            .pipe( conn.newer( remoteFolder ) ) // only upload newer files 
            .pipe( conn.dest( remoteFolder ) )
        ;
    });
});

// send files to client
gulp.task('ftp-deploy-client', function() {
    var remoteFolderClient = '/'+mainSettings.FtpDir_Client;
    var conn = getFtpConnection('public');
    return gulp.src(localFilesGlob, { base: '.', buffer: false })
        .pipe( conn.newer( remoteFolderClient ) ) // only upload newer files 
        .pipe( conn.dest( remoteFolderClient ) )
    ;
});
