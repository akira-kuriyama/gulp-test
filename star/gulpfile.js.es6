// TODO:
// gulp-autoprefixerほしいかも (sass mixinでもできるがこっちのほうがなにも考える適用されるので
// sourcemap

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')({
    pattern: [
        'gulp-*',
        'gulp.*',
        'run-sequence',
        'del',
        'browserify',
        'babelify',
        'vinyl-source-stream',
        'vinyl-buffer'
    ]
});

const jsDir = {src: 'app/assets/javascripts/', dest: 'public/javascripts/'};
const cssDir = {src: 'app/assets/stylesheets/', dest: 'public/stylesheets/'};
const imageDir = {src: 'app/assets/images/', dest: 'public/images/'};
const styleGuideTmpDir = 'tmp/styleguide';

gulp.task('js', () => {
    // browserifyのコンパイル時間が長くなってきたらgulp-watchifyを検討
    plugins.browserify(`${jsDir.src}babel/index.js`, {debug: true})
        .transform(plugins.babelify)
        .bundle()
        .on('error', err => {
            plugins.notify.onError(err.message);
        })
        .pipe(plugins.vinylSourceStream('bundle.js'))
        .pipe(plugins.vinylBuffer())
        .pipe(gulp.dest(jsDir.dest))
        .pipe(plugins.livereload());
});
gulp.task('eslint', () => {
    return gulp.src(`${jsDir.src}**/*.js`)
        .pipe(plugins.cached('eslint'))
        .pipe(plugins.plumber({errorHandler: plugins.notify.onError('<%= error.message %>')}))
        .pipe(plugins.eslint({useEslintrc: true}))
        .pipe(plugins.eslint.format())
        .pipe(plugins.eslint.failOnError())
        .pipe(plugins.livereload());
});
gulp.task('sprite', () => {
    const spriteConfig = [
        {path: 'sprites/hoge', imageName: 'sprite1'},
        {path: 'sprites/jump', imageName: 'sprite-jump'}
    ];
    spriteConfig.forEach(config => {
        const spriteData = gulp.src(`${imageDir.src}${config.path}/*`)
            .pipe(plugins.spritesmith({
                imgName: `${config.imageName}.png`,
                cssName: `_${config.imageName}.scss`,
                imgPath: `${imageDir.dest}${config.path}/${config.imageName}.png`,
                cssVarMap(sprite) {
                    sprite.name = `sprite-${sprite.name}`;
                }
            }));
        spriteData.img.pipe(gulp.dest(imageDir.dest + config.path)); //imgNameで指定したスプライト画像の保存先
        spriteData.css.pipe(gulp.dest(cssDir.src + config.path)); //cssNameで指定したcssの保存先
    });
});
gulp.task('webfont', () => {
    return plugins.runSequence(
        'webfont--generate',
        'webfont--move');
});
gulp.task('webfont--generate', () => {
    gulp.src(`${imageDir.src}icons`)
        .pipe(plugins.fontcustom({
            font_name: 'myfont', // defaults to 'fontcustom',
            'css-selector': '.prefix-{{glyph}}'
        }))
        .pipe(gulp.dest(`${imageDir.dest}webfonts`));
});
gulp.task('webfont--move', () => {
    gulp.src(`${imageDir.dest}webfonts/**/*.css`)
        .pipe(gulp.dest(cssDir.dest));
    gulp.src(`${imageDir.dest}webfonts/myfont.{eot,svg,ttf,woff}`)
        .pipe(gulp.dest(imageDir.dest));
    // 生成元ディレクトリを削除したかったら削除する
});
gulp.task('image', () => {
    gulp.src(`${imageDir.src}**/*`)
        .pipe(plugins.changed(imageDir.dest))
        .pipe(plugins.imagemin())
        .pipe(gulp.dest(imageDir.dest));
});
gulp.task('sass', () => {
    gulp.src(`${cssDir.src}**/*.scss`)
        .pipe(plugins.cached('sass'))
        .pipe(plugins.sass())
        //.pipe(minifyCss({compatibility: 'ie8'})) minifyはデプロイの際にやったほうがよさそう
        .pipe(gulp.dest(cssDir.dest))
        .pipe(plugins.livereload());
});
gulp.task('csslint', () => {
    gulp.src(`${cssDir.dest}**/*.css`)
        .pipe(plugins.cached('csslint'))
        .pipe(plugins.plumber({errorHandler: plugins.notify.onError('<%= error.message %>')}))
        .pipe(plugins.csslint())
        .pipe(plugins.csslint.reporter())
        .pipe(plugins.csslint.reporter('fail')); // plumberで拾うためにわざとfailさせている
});
gulp.task('styleguide', done => {
    return plugins.runSequence(
        'styleguide--sass-compile-into-tmp',
        'styleguide--generate-styleguide',
        'styleguide--clean-tmp');
});
gulp.task('styleguide--sass-compile-into-tmp', () => {
    return gulp.src(`${cssDir.src}**/*.scss`)
        .pipe(plugins.sass())
        .pipe(gulp.dest(styleGuideTmpDir));
});
gulp.task('styleguide--generate-styleguide', cd => {
    return gulp.src(`${styleGuideTmpDir}/**/*.css`)
        .pipe(plugins.styledocco({
            out: 'styleguide',
            name: 'My Project',
            'no-minify': true
        }));
});
gulp.task('styleguide--clean-tmp', cd => {
    plugins.del(styleGuideTmpDir, cd);
});
gulp.task('watch', () => {
    plugins.livereload.listen();
    gulp.watch(`${jsDir.src}**/*.js`, ['js', 'eslint']);
    gulp.watch(`${cssDir.src}**/*.scss`, ['sass']);
    gulp.watch(`${cssDir.dest}**/*.css`, ['csslint']);
});