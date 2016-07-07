var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();
var cleanCSS = require('gulp-clean-css');
var nodemon = require('nodemon');


gulp.task("server",function() {
  return nodemon({
    script: "./bin/www",
    watch: ["src/", "src/javascripts/", "routes/"],
    delay: 50
  });
});

gulp.task('browserSync', function() {
  browserSync.init({
    server: {
      baseDir: './'
    },
  })
});

gulp.task('sass', function(){
   return gulp.src('src/stylesheets/**/*.scss')
    .pipe(sass())
    .pipe(cleanCSS()) 
    .pipe(gulp.dest('public/stylesheets'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('view', function(){
   return gulp.src('views/**/*.ejs')
    .pipe(browserSync.reload({
        stream: true
    }))
});

gulp.task('watch', function(){
    gulp.watch('src/stylesheets/**/*.scss', ['sass']);
    gulp.watch('views/**/*.ejs', ['view']);
});

gulp.task('default', ['server','sass', 'view', 'watch']);
gulp.task('build', ['sass', 'view']);
