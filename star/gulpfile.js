// コンパイル、

// 結合、
// 圧縮、
// JS依存関係、
// eslint自動実行、
// JSテスト自動実行、
// sourcemap

// 画像最適化、
//
// スプライト、
// svgのフォント化、

// ライブリロード、

// csslint自動実行、

var gulp = require('gulp');
var sass = require('gulp-sass');
var styledocco = require('gulp-styledocco');

gulp.task('sass', function() {
  gulp.src("app/assets/**/*.scss")
    .pipe(styledocco({
      out : 'styleguide',
      name: 'My Project',
      'no-minify': true
    }))
    .pipe(sass())
    .pipe(gulp.dest("public"));

});
