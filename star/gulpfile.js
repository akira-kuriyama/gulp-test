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
// -- svgのフォント化(gulp-fontcustom)

// ライブリロード、
//   js  compile
//   css compile, csprite, csslint

// csslint自動実行、
// postcss or mixinライブラリ
// css, jsの圧縮って他のプロジェクトってどのタイミングで行っている？

//入れるかも？
// gulp-htmlhint
// gulp-load-tasks
// gulp-notify

// gulpをes6で書く

var gulp = require('gulp');
// js
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');
var eslint = require('gulp-eslint');

// css
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var csslint = require('gulp-csslint');
var styledocco = require('gulp-styledocco');
// image
var imagemin = require('gulp-imagemin');
var spritesmith = require('gulp.spritesmith');
var fontcustom = require('gulp-fontcustom');

// util
var changed = require('gulp-changed');
var cache = require('gulp-cached');
var del = require('del');
var runSequence = require('run-sequence');
var livereload = require('gulp-livereload');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');

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
});

gulp.task('webfont', function () {
    return runSequence(
        'webfont--generate',
        'webfont--move');
});

gulp.task('webfont--generate', function () {
    gulp.src(imageDir.src + "icons")
        .pipe(fontcustom({
            font_name: 'myfont',  // defaults to 'fontcustom',
            'css-selector': '.prefix-{{glyph}}'
        }))
        .pipe(gulp.dest(imageDir.dest + 'webfonts'))

});

gulp.task('webfont--move', function () {
    gulp.src(imageDir.dest + 'webfonts/**/*.css')
        .pipe(gulp.dest(cssDir.dest));
    gulp.src(imageDir.dest + 'webfonts/myfont.{eot,svg,ttf,woff}')
        .pipe(gulp.dest(imageDir.dest));
    // 生成元ディレクトリを削除したかったら削除する
});

gulp.task('image', function () {
    gulp.src(imageDir.src + '**/*')
        .pipe(changed(imageDir.dest))
        .pipe(imagemin())
        .pipe(gulp.dest(imageDir.dest));
});

gulp.task('js', function () {
    gulp.src(jsDir.src + '**/*.js')
        .pipe(cache('js'))
        .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
        .pipe(babel())
        //.pipe(uglify())
        .pipe(gulp.dest(jsDir.dest))
        .pipe(livereload());
});

gulp.task('eslint', function () {
    return gulp.src(jsDir.src + '**/*.js')
        .pipe(cache('eslint'))
        .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
        .pipe(eslint({useEslintrc: true}))
        .pipe(eslint.format())
        .pipe(eslint.failOnError())
        .pipe(livereload());
});

gulp.task('sass', function () {
    gulp.src(cssDir.src + '**/*.scss')
        .pipe(cache('sass'))
        .pipe(sass())
        //.pipe(minifyCss({compatibility: 'ie8'})) minifyはデプロイの際にやったほうがよさそう
        .pipe(gulp.dest(cssDir.dest))
        .pipe(livereload());
});
gulp.task('csslint', function () {
    gulp.src(cssDir.dest + '**/*.css')
        .pipe(cache('csslint'))
        .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
        .pipe(csslint())
        .pipe(csslint.reporter())
        .pipe(csslint.reporter('fail')); // plumberで拾うためにわざとfailさせている
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
    gulp.watch(jsDir.src + '**/*.js', ['js', 'eslint']);
    gulp.watch(cssDir.src + '**/*.scss', ['sass']);
    gulp.watch(cssDir.dest + '**/*.css', ['csslint']);
});
