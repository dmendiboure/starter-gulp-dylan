const gulp = require('gulp');
const del = require('del');
const htmlmin = require('gulp-htmlmin');
const cleanCss = require('gulp-clean-css');
const plumber = require('gulp-plumber');
const imagemin = require('gulp-imagemin');
const autoprefixer = require('gulp-autoprefixer');
const browsersync = require('browser-sync');
const sass = require('gulp-dart-sass');
const phpConnect = require('gulp-connect-php');
const terser = require('gulp-terser');

const distFolder = './dist/';
const srcFolder = './src/';

const paths = {
  css: {
    src: './src/assets/css/**/*.css',
    dest: './dist/assets/css/',
  },
  scss: {
    src: './src/assets/scss/**/*.scss',
    dest: './src/assets/css/',
  },
  html: {
    src: './src/**/*.html',
    dest: './dist/',
  },
  php: {
    src: './src/**/*.php',
    dest: './dist/',
  },
  img: {
    src: './src/assets/img/**/*',
    dest: './dist/assets/img/',
  },
  fonts: {
    src: './src/assets/fonts/**/*',
    dest: './dist/assets/fonts/',
  },
  js: {
    src: './src/assets/js/**/*.js',
    dest: './dist/assets/js/',
  },
};

function browserSyncDev() {
  browsersync.init({
    server: {
      baseDir: srcFolder,
    },
    port: 3000,
  });
}

function browserSyncBuild() {
  browsersync.init({
    server: {
      baseDir: distFolder,
    },
    port: 3000,
  });
}

function browserSyncPhp(done) {
  browsersync.reload();
  done();
}

function connectDev() {
  phpConnect.server({
    keepalive: true,
    base: srcFolder,
  }, () => {
    browsersync({
      proxy: '127.0.0.1:8000',
    });
  });
}

function connectBuild() {
  phpConnect.server({
    keepalive: true,
    base: distFolder,
  }, () => {
    browsersync({
      proxy: '127.0.0.1:8000',
    });
  });
}

function clear() {
  return del([distFolder]);
}

function htmlBuild() {
  return (
    gulp
      .src(paths.html.src, { since: gulp.lastRun(htmlBuild) })
      .pipe(plumber())
      .pipe(htmlmin({ collapseWhitespace: true }))
      .pipe(gulp.dest(paths.html.dest))
      .pipe(browsersync.stream())
  );
}

function htmlDev() {
  return (
    gulp
      .src(paths.html.src, { since: gulp.lastRun(htmlDev) })
      .pipe(browsersync.stream())
  );
}

function scss() {
  return (
    gulp
      .src(paths.scss.src)
      .pipe(sass().on('error', sass.logError))
      .pipe(gulp.dest(paths.scss.dest))
      .pipe(browsersync.stream())
  );
}

function css() {
  return (
    gulp
      .src(paths.css.src, { since: gulp.lastRun(css) })
      .pipe(plumber())
      .pipe(autoprefixer())
      .pipe(cleanCss())
      .pipe(gulp.dest(paths.css.dest))
      .pipe(browsersync.stream())
  );
}

function js() {
  return (
    gulp
      .src(paths.js.src, { since: gulp.lastRun(js) })
      .pipe(plumber())
      .pipe(terser())
      .pipe(gulp.dest(paths.js.dest))
      .pipe(browsersync.stream())
  );
}

function php() {
  return gulp
    .src(paths.php.src)
    .pipe(htmlmin({
      collapseWhitespace: true,
      ignoreCustomFragments: [/<%[\s\S]*?%>/, /<\?[=|php]?[\s\S]*?\?>/],
    }))
    .pipe(gulp.dest(paths.php.dest));
}

function images() {
  return (
    gulp
      .src(paths.img.src)
      .pipe(plumber())
      .pipe(imagemin())
      .pipe(gulp.dest(paths.img.dest))
      .pipe(browsersync.stream())
  );
}

function fonts() {
  return (
    gulp
      .src(paths.fonts.src, { since: gulp.lastRun(fonts) })
      .pipe(plumber())
      .pipe(gulp.dest(paths.fonts.dest))
      .pipe(browsersync.stream())
  );
}

function watchBuild() {
  gulp.watch(paths.scss.src, scss);
  gulp.watch(paths.css.src, css);
  gulp.watch(paths.html.src, htmlBuild);
  gulp.watch(paths.img.src, images);
}

function watchBuildPhp() {
  gulp.watch(paths.scss.src, scss);
  gulp.watch(paths.css.src, css);
  gulp.watch(paths.html.src, htmlBuild);
  gulp.watch(paths.img.src, images);
  gulp.watch(paths.php.src, gulp.series(php, browserSyncPhp));
}

function watchDev() {
  gulp.watch(paths.scss.src, scss);
  gulp.watch(paths.html.src, htmlBuild);
}

function watchDevPhp() {
  gulp.watch(paths.scss.src, scss);
  gulp.watch(paths.html.src, htmlDev);
  gulp.watch(paths.php.src, gulp.series(browserSyncPhp));
}

const serie = gulp.series(clear, htmlBuild, scss, css, js, images, fonts);
const seriePhp = gulp.series(serie, php);

const build = gulp.series(serie, gulp.parallel(watchBuild, browserSyncBuild));
const phpBuild = gulp.series(seriePhp, gulp.parallel(watchBuildPhp, connectBuild));

const dev = gulp.series(scss, gulp.parallel(watchDev, browserSyncDev));
const phpDev = gulp.series(scss, gulp.parallel(watchDevPhp, connectDev));

exports.build = build;
exports.default = dev;
exports.php = phpDev;
exports.phpbuild = phpBuild;
