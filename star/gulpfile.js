// --コンパイル、
// --styleguide
// -- css結合(sassのimport機能で代替できるはず)
// -- css圧縮、⇒圧縮系はdeploy時にやるべきだと思う。csslint書けても圧縮済みのcssにかかって見難い。あとstyleguide生成時も困る
// -- csslint
// gulp-autoprefixerほしいかも (sass mixinでもできるがこっちのほうがなにも考える適用されるので

// -- js圧縮
// JS依存関係、
// eslint自動実行、
// JSテスト自動実行、
// sourcemap

// -- 画像最適化、
//
// -- スプライト、
// svgのフォント化(gulp-fontcustom)

// ライブリロード、
//   js  compile
//   css compile, csprite, sslint, postcss?

// csslint自動実行、
// postcss or mixinライブラリ
// css, jsの圧縮って他のプロジェクトってどのタイミングで行っている？

//入れるかも？
// gulp-htmlhint
// gulp-load-tasks
// gulp-notify

// gulpをes6で書く

var gulp = require('gulp');
// css
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var csslint = require('gulp-csslint');
var styledocco = require('gulp-styledocco');
// js
var uglify = require('gulp-uglify');
// image
var imagemin = require('gulp-imagemin');
var spritesmith = require('gulp.spritesmith');
// util
var changed = require('gulp-changed');
var del = require('del');
var runSequence = require('run-sequence');
var livereload = require('gulp-livereload');

var jsDir = {src: 'app/assets/javascripts/', dest: 'public/javascripts/'};
var cssDir = {src: 'app/assets/stylesheets/', dest: 'public/stylesheets/'};
var imageDir = {src: 'app/assets/images/', dest: 'public/images/'};
var styleGuideTmpDir = 'tmp/styleguide';

gulp.task('sprite', function () {
    var spriteConfig = [
        {path: 'sprites/hoge', imageName: 'sprite1'},
        {path: 'sprites/jump', imageName: 'sprite-jump'}];
    spriteConfig.forEach(function (config) {
        var spriteData = gulp.src(imageDir.src + config.path + '/*')
                .pipe(spritesmith({
                    imgName: config.imageName + '.png',
                    cssName: '_' + config.imageName + '.scss',
                    imgPath: imageDir.dest + config.path + '/' + config.imageName + '.png',
                    cssVarMap: function (sprite) {
                        sprite.name = 'sprite-' + sprite.name;
                    }
                })
            )
            ;
        spriteData.img.pipe(gulp.dest(imageDir.dest + config.path)); //imgNameで指定したスプライト画像の保存先
        spriteData.css.pipe(gulp.dest(cssDir.src + config.path)); //cssNameで指定したcssの保存先
    });
})
;

gulp.task('image', function () {
    gulp.src(imageDir.src + '**/*')
        .pipe(changed(imageDir.dest))
        .pipe(imagemin())
        .pipe(gulp.dest(imageDir.dest));
});

gulp.task('js', function () {
    gulp.src(jsDir.src + '**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest(jsDir.dest))
        .pipe(livereload());
});

gulp.task('sass', function () {
    gulp.src(cssDir.src + '**/*.scss')
        .pipe(csslint())
        .pipe(csslint.reporter())
        .pipe(sass())
        .pipe(minifyCss({compatibility: 'ie8'}))
        .pipe(gulp.dest(cssDir.dest))
        .pipe(livereload());
});
gulp.task('csslint', function () {
    gulp.src(cssDir.dest + '**/*.css')
        .pipe(csslint())
        .pipe(csslint.reporter());
});
gulp.task('styleguide', function (done) {
    return runSequence(
        'styleguide--sass-compile-into-tmp',
        'styleguide--generate-styleguide',
        'styleguide--clean-tmp');
});
gulp.task('styleguide--sass-compile-into-tmp', function () {
    return gulp.src(cssDir.src + '**/*.scss')
        .pipe(sass())
        .pipe(gulp.dest(styleGuideTmpDir));
});
gulp.task('styleguide--generate-styleguide', function (cd) {
    return gulp.src(styleGuideTmpDir + '/**/*.css')
        .pipe(styledocco({
            out: 'styleguide',
            name: 'My Project',
            'no-minify': true
        }));
});
gulp.task('styleguide--clean-tmp', function (cd) {
    del(styleGuideTmpDir, cd);
});

gulp.task('watch', function () {
    livereload.listen();
    gulp.watch(jsDir.src + '**/*.js', ['js']);
    gulp.watch(cssDir.src + '**/*.scss', ['sass']);
});
