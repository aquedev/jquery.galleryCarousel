/*jslint browser:true, white:false, onevar: true*/
/*global window, jQuery */
/*
Authors: David Taylor/Stephen Zsolnai http://the-taylors.org/
ver: 1.0
Requires: 
jQuery v1.5.2 or later: http://docs.jquery.com/Downloading_jQuery#Download_jQuery
jQuery cycle plugin: https://raw.github.com/malsup/cycle/master/jquery.cycle.all.js
jQuery jCarousel: http://sorgalla.com/jcarousel
	
Usage:
$(function(){
$('#targetElement').galleryCarousel({});
});
	
Options (defaults):
activeItemClass: 'scroller-image-selected',
height: 280,
width: null,
showControls: true,
allowFullScreen: true,
fullScreenOnLoad: false,
auto: true,
cycleSettings: {}
	
*/
(function ($) {
    'use strict';

    var SETTINGS_KEY = 'gallerySettings',
        GAL_WRAPPER_CLASS = 'galleryCarouselParent',
        GAL_NEXT_DISABLED = 'gallery-next-image-disabled',
        GAL_PREV_DISABLED = 'gallery-prev-image-disabled',
        GAL_PAUSED_ICON_CLASS = 'carouselControl-paused',
        GAL_PLAYING_ICON_CLASS = 'carouselControl-playing',
        CONTROLS_HEIGHT = 56,
        CONTROLS_FULLSCR_HEIGHT = 80,

        DEFAULTS = {
            activeItemClass: 'scroller-image-selected',
            height: 280,
            width: null,
            showControls: true,
            allowFullScreen: true,
            fullScreenOnLoad: false,
            auto: true,
            cycleSettings: {
                fx: 'fade',
                speed: 600,
                timeout: 3000,
                pause: false,
                cleartype: true
            }
        },
		fullScreenInitialised = false,
		itemindex = 1;

    $.fn.galleryCarousel = function (options) {

        return this.each(function () {
            var settings = $.extend(true, {}, DEFAULTS, options),
				beforeFullscreen = {}; //this will contain details of the gallery element before detachment and full screen

			var playSlideShow = function ($elem) {
			    settings.$imageWrapper.cycle('resume');
			    settings.$carouselControl.addClass(GAL_PLAYING_ICON_CLASS).removeClass(GAL_PAUSED_ICON_CLASS);
			},
			pauseSlideShow = function ($elem) {
			    settings.$imageWrapper.cycle('pause');
			    settings.$carouselControl.addClass(GAL_PAUSED_ICON_CLASS).removeClass(GAL_PLAYING_ICON_CLASS);
			},
			showControls = function ($elem) {
			    $elem.append('<a class="carouselControl" href="#"></a>');
			    settings.$carouselControl = $elem.find('.carouselControl');
			    if (settings.auto) {
			        settings.$carouselControl.addClass(GAL_PLAYING_ICON_CLASS);
			    }
			    settings.$carouselControl.click(function(e) {
			    	if($(this).hasClass(GAL_PLAYING_ICON_CLASS)){
			    		pauseSlideShow($(this));
			        	e.preventDefault();
				    }else{
			        	playSlideShow($(this));
		        		e.preventDefault();
			        }
			    });
			},
			removeFullScreen = function () {
			    var $gallery = settings.$carousel.closest('.' + GAL_WRAPPER_CLASS),
			        $fullImages = $gallery.find('.galleryCarousel-images'),
			        $controls = $gallery.find('.carousel-wrapper');

			    $gallery.detach();
			    $gallery.removeClass('galleryCarouselTfullScreen');
			    $gallery.height(beforeFullscreen.height);

			    $fullImages.height(settings.height - CONTROLS_HEIGHT);
			    $controls.height(CONTROLS_HEIGHT);

			    $('html').css({ 'overflow': 'auto' });

			    window.scroll(beforeFullscreen.x, beforeFullscreen.y);
			    if (beforeFullscreen.index >= beforeFullscreen.parentElement.children().length) {
			        beforeFullscreen.parentElement.append($gallery);
			    } else {
			        $gallery.insertBefore(beforeFullscreen.parentElement.children().get(beforeFullscreen.index));
			    }
				fullScreenInitialised = false;
			},
			attachFullScreenImage = function($refImage){
				$('<img class="full-image" src="' + $refImage.data('fullscreen') +'" alt="' + $refImage.attr('title') + ' fullscreen" />').appendTo($refImage.closest('li'));
			},
			goFullScreen = function () {
			    var $gallery = settings.$carousel.closest('.' + GAL_WRAPPER_CLASS),
			        $fullImages = $gallery.find('.galleryCarousel-images'),
			        $controls = $gallery.find('.carousel-wrapper'),
			        
			        windowHeight = $(window).height();

				if(!fullScreenInitialised){
					//attach full screen images
					$fullImages.find('.galleryCarousel-cycle li').each(function(){
						attachFullScreenImage($(this).find('img'));
					});
				}
					
			    beforeFullscreen = {
			        parentElement: $gallery.parent(),
			        index: $gallery.parent().children().index($gallery),
			        height: $gallery.outerHeight(),
			        x: $(window).scrollLeft(),
			        y: $(window).scrollTop()
			    };
			    $gallery.detach();
			    $gallery.addClass('galleryCarouselTfullScreen').appendTo('body');
			    $gallery.height(windowHeight);

			    $fullImages.height(windowHeight - CONTROLS_FULLSCR_HEIGHT);
			    $controls.height(CONTROLS_FULLSCR_HEIGHT);

			    $('html').css({ 'overflow': 'hidden' });
			    window.scroll(0, 0);

			    $(document).keyup(function (e) {
			        if (e.keyCode === 27) {
			            removeFullScreen();
			            settings.$carousel.find('.carouselControl-fullScreen').removeClass('fullScreen-active');
			        }
			    });
				
				fullScreenInitialised = true;
			},
			initFullScreen = function () {
			    settings.$carousel.append('<a href="#" class="carouselControl-fullScreen"></a>');
			    var $trigger = settings.$carousel.find('.carouselControl-fullScreen');
			    $trigger.click(function (e) {
			        if ($(this).hasClass('fullScreen-active')) {
			            removeFullScreen();
			            $(this).removeClass('fullScreen-active');
			        } else {
			            goFullScreen();
			            $(this).addClass('fullScreen-active');
			        }
			        e.preventDefault();
			    });

			    if (settings.fullScreenOnLoad) { goFullScreen(); }

			},
			showContent = function (elementID, slideSpeed) {
			    var $elem = $('#' + elementID),

				hgt = $elem
					.children()
					.children('.images-caption-content')
					.outerHeight();

			    $elem
					.children('.galleryCarousel-images-caption')
					.stop(true, true)
					.animate({height: hgt}, slideSpeed);
			}, 
			hideContent = function(elementID, slideSpeed){
				var $elem = $('#' + elementID);
				$elem
					.children('.galleryCarousel-images-caption')
					.stop(true, false)
					.animate({ height: 0 }, slideSpeed);
			},
			showSlide = function (elemId) {
			    var $slide = $('#' + elemId),
					slideIndex = $slide.index(),
					$origImage = $slide.find('img'),
				    fullScreenHref = $origImage.data('fullscreen');
					
			    settings.$imageWrapper.cycle(slideIndex);
			    settings.$currentSlide = $slide;

				if (slideIndex >= settings.totalSlides) {
					settings.$galleryNextLink.addClass(GAL_NEXT_DISABLED);   
				} else {
					settings.$galleryNextLink.removeClass(GAL_NEXT_DISABLED);
				}

				if (slideIndex <= 0) {
					settings.$galleryPrevLink.addClass(GAL_PREV_DISABLED);
				} else {
					settings.$galleryPrevLink.removeClass(GAL_PREV_DISABLED);
				}
			},
			activateSlide = function ($elem) {
			    $elem.siblings().removeClass(settings.activeItemClass);
			    $elem.addClass(settings.activeItemClass);
			},
			carousel_initCallback = function (carousel) {

			    settings.$galleryNextLink.bind('click', function () {
			        if (!$(this).hasClass(GAL_NEXT_DISABLED)) {
			            showSlide(settings.$currentSlide.next().attr('id'));
			            carousel.scroll($.jcarousel.intval(settings.$currentSlide.index()));
			        }
			        return false;
			    });
			    settings.$galleryPrevLink.bind('click', function () {
			        if (!($(this).hasClass(GAL_PREV_DISABLED))) {
			            showSlide(settings.$currentSlide.prev().attr('id'));
			            carousel.scroll($.jcarousel.intval(settings.$currentSlide.index()));
			        }
			        return false;
			    });
			},
			initialiseCarousel = function ($carousel, settings) {
			    $carousel
				.data(SETTINGS_KEY, settings)
				.jcarousel({
				    auto: 0,
				    scroll: 5,
				    initCallback: carousel_initCallback
				});
			    if (settings.showControls) { showControls($carousel); }
			    if (settings.allowFullScreen) { initFullScreen(); }
			},
			initialiseCycle = function ($wrapper, $imageWrapper, settings) {

			    var beforeCycle = function (currSlideElement, nextSlideElement, options, forwardFlag) {
			        hideContent(currSlideElement.id, settings.cycleSettings.speed);
			        $wrapper.find('.jcarousel-item').each(function () {
			            if ($(this).index() === $(nextSlideElement).index()) {
			                activateSlide($(this));
			            }
			        });
			    },
				afterCycle = function (currSlideElement, nextSlideElement, options, forwardFlag) {
				    showContent(nextSlideElement.id, settings.cycleSettings.speed);
				};

			    $.extend(settings.cycleSettings, {
			        before: beforeCycle,
			        after: afterCycle
			    });
			    $imageWrapper.cycle(settings.cycleSettings);
			    if (!settings.auto) { $imageWrapper.cycle('pause'); }
			},
			initialiseInteractions = function($wrapper){
				$wrapper.find('.carousel-item-link').click(function(e){
					var href = $(this).attr('href');
					href = href.substr(href.lastIndexOf("#")+1);
					//activateSlide($(this).parent());
					showSlide(href);
					e.preventDefault();
				});
			},
			// positioning, element settings
			setPositioning = function($wrapper, settings){
				$wrapper.height(settings.height + 'px').width(settings.width + 'px');
			},
			buildImageGallery = function($elem, settings){
				var imageData = [],
					imageItem,
					carouselItem;

				$elem.append('<div class="galleryCarousel-images"><ul class="galleryCarousel-cycle"></ul><a href="#" class="gallery-prev-image gallery-prev-image-disabled">Previous Image</a><a href="#" class="gallery-next-image">Next Image</a></div><div class="carousel-wrapper cc"><ul class="galleryCarousel-scroller"></ul></div>');

				var $fullImages = $elem.find('.galleryCarousel-images').height(settings.height - 62);
				
				settings.$imageWrapper = $elem.find('.galleryCarousel-cycle');
				settings.$carousel = $elem.find('.carousel-wrapper');
				settings.fullScreenUrls = [];
				$elem.find('ul li').each(function(){
				    var $this = $(this),
				        $link = $this.find('>a'),
				        $img  = $link.find('>img'),
				        title = $img.attr('title'),
				        $caption = $link.find('>p'),
				        captionHtml = $caption.html(),
				        thumbImageSrc = $img.attr('src'),
				        medImageSrc = $link.attr('href');
				        //fullImageSrc = $link.data('fullscreen');


					imageItem = '<li id="carousel-item-' + itemindex + '">';
					imageItem += '<div class="galleryCarousel-images-caption"><div class="images-caption-content">';
					imageItem += '<h3>' + title + '</h3>';
					imageItem += '<p>' + captionHtml + '</p>';
					imageItem += '</div><div class="images-caption-trans">&nbsp;</div></div>';
					imageItem += '<img class="med-image" data-fullscreen="' + $link.data('fullscreen') + '" src="' + medImageSrc + '" title="' + title + '" alt="' + title + '" />';
					//imageItem += '<img class="full-image" src="' + fullImageSrc +'" alt="' + title + '" />';
					imageItem += '</li>';

					carouselItem = '<li><a class="carousel-item-link" href="#carousel-item-' + itemindex + '" >';
					carouselItem += '<img src="' + thumbImageSrc + '" title="view" alt="view" /></a><span class="scroller-overLay"></span></li>';

					settings.$imageWrapper.append(imageItem);
					settings.$carousel.find('.galleryCarousel-scroller').append(carouselItem);
					settings.fullScreenUrls.push($(this).find('a').data('fullscreen'));
					itemindex += 1;
				});
				$elem.find('> ul').remove();
			},
			initialiseGallery = function(settings){
			
				var $self = $(this);
				buildImageGallery($self, settings);
				$self.addClass(GAL_WRAPPER_CLASS);
				
				settings.$currentSlide           = settings.$imageWrapper.children('li:first-child');
				settings.$carouselItem           = $self.find('.jcarousel-item a');
				settings.totalSlides             = (settings.$imageWrapper.children().size() - 1); //-1 to account for the zero index
				settings.$carouselScroller       = $self.find('.galleryCarousel-scroller');
				settings.$galleryNextLink        = $self.find('.gallery-next-image');
				settings.$galleryPrevLink        = $self.find('.gallery-prev-image');
				

			    $self.data(SETTINGS_KEY, settings);


			    setPositioning($self, settings);
			    initialiseCarousel(settings.$carousel, settings);
			    initialiseCycle($self, settings.$imageWrapper, settings);
			    initialiseInteractions($self);
			};


            initialiseGallery.call(this, settings);
        });
    };

} (jQuery));
