//  css圧縮、⇒圧縮系はdeploy時にやるべきだと思う。csslint書けても圧縮済みのcssにかかって見難い。あとstyleguide生成時も困る
// gulp-autoprefixerほしいかも (sass mixinでもできるがこっちのほうがなにも考える適用されるので

// js圧縮
// JS依存関係、
// sourcemap


// gulpをes6で書く

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')({
    pattern: ['gulp-*', 'gulp.*', 'run-sequence', 'del']
});

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
                .pipe(plugins.spritesmith({
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
    return plugins.runSequence(
        'webfont--generate',
        'webfont--move');
});

gulp.task('webfont--generate', function () {
    gulp.src(imageDir.src + "icons")
        .pipe(plugins.fontcustom({
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
        .pipe(plugins.changed(imageDir.dest))
        .pipe(plugins.imagemin())
        .pipe(gulp.dest(imageDir.dest));
});

gulp.task('js', function () {
    gulp.src(jsDir.src + '**/*.js')
        .pipe(plugins.cached('js'))
        .pipe(plugins.plumber({errorHandler: plugins.notify.onError('<%= error.message %>')}))
        .pipe(plugins.babel())
        //.pipe(uglify())
        .pipe(gulp.dest(jsDir.dest))
        .pipe(plugins.livereload());
});

gulp.task('eslint', function () {
    return gulp.src(jsDir.src + '**/*.js')
        .pipe(plugins.cached('eslint'))
        .pipe(plugins.plumber({errorHandler: plugins.notify.onError('<%= error.message %>')}))
        .pipe(plugins.eslint({useEslintrc: true}))
        .pipe(plugins.eslint.format())
        .pipe(plugins.eslint.failOnError())
        .pipe(plugins.livereload());
});

gulp.task('sass', function () {
    gulp.src(cssDir.src + '**/*.scss')
        .pipe(plugins.cached('sass'))
        .pipe(plugins.sass())
        //.pipe(minifyCss({compatibility: 'ie8'})) minifyはデプロイの際にやったほうがよさそう
        .pipe(gulp.dest(cssDir.dest))
        .pipe(plugins.livereload());
});
gulp.task('csslint', function () {
    gulp.src(cssDir.dest + '**/*.css')
        .pipe(plugins.cached('csslint'))
        .pipe(plugins.plumber({errorHandler: plugins.notify.onError('<%= error.message %>')}))
        .pipe(plugins.csslint())
        .pipe(plugins.csslint.reporter())
        .pipe(plugins.csslint.reporter('fail')); // plumberで拾うためにわざとfailさせている
});
gulp.task('styleguide', function (done) {
    return plugins.runSequence(
        'styleguide--sass-compile-into-tmp',
        'styleguide--generate-styleguide',
        'styleguide--clean-tmp');
});
gulp.task('styleguide--sass-compile-into-tmp', function () {
    return gulp.src(cssDir.src + '**/*.scss')
        .pipe(plugins.sass())
        .pipe(gulp.dest(styleGuideTmpDir));
});
gulp.task('styleguide--generate-styleguide', function (cd) {
    return gulp.src(styleGuideTmpDir + '/**/*.css')
        .pipe(plugins.styledocco({
            out: 'styleguide',
            name: 'My Project',
            'no-minify': true
        }));
});
gulp.task('styleguide--clean-tmp', function (cd) {
    plugins.del(styleGuideTmpDir, cd);
});

gulp.task('watch', function () {
    plugins.livereload.listen();
    gulp.watch(jsDir.src + '**/*.js', ['js', 'eslint']);
    gulp.watch(cssDir.src + '**/*.scss', ['sass']);
    gulp.watch(cssDir.dest + '**/*.css', ['csslint']);
});
