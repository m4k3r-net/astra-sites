/**
 * AJAX Request Queue
 *
 * - add()
 * - remove()
 * - run()
 * - stop()
 *
 * @since 1.0.0
 */
var AstraSitesAjaxQueue = (function() {

	var requests = [];

	return {

		/**
		 * Add AJAX request
		 *
		 * @since 1.0.0
		 */
		add:  function(opt) {
		    requests.push(opt);
		},

		/**
		 * Remove AJAX request
		 *
		 * @since 1.0.0
		 */
		remove:  function(opt) {
		    if( jQuery.inArray(opt, requests) > -1 )
		        requests.splice($.inArray(opt, requests), 1);
		},

		/**
		 * Run / Process AJAX request
		 *
		 * @since 1.0.0
		 */
		run: function() {
		    var self = this,
		        oriSuc;

		    if( requests.length ) {
		        oriSuc = requests[0].complete;

		        requests[0].complete = function() {
		             if( typeof(oriSuc) === 'function' ) oriSuc();
		             requests.shift();
		             self.run.apply(self, []);
		        };

		        jQuery.ajax(requests[0]);

		    } else {

		      self.tid = setTimeout(function() {
		         self.run.apply(self, []);
		      }, 1000);
		    }
		},

		/**
		 * Stop AJAX request
		 *
		 * @since 1.0.0
		 */
		stop:  function() {

		    requests = [];
		    clearTimeout(this.tid);
		}
	};

}());

(function($){

	var AstraSSEImport = {

		complete: {
			posts: 0,
			media: 0,
			users: 0,
			comments: 0,
			terms: 0,
		},

		updateDelta: function (type, delta) {
			this.complete[ type ] += delta;

			var self = this;
			requestAnimationFrame(function () {
				self.render();
			});
		},
		updateProgress: function ( type, complete, total ) {
			var text = complete + '/' + total;

			if( 'undefined' !== type && 'undefined' !== text ) {
				total = parseInt( total, 10 );
				if ( 0 === total || isNaN( total ) ) {
					total = 1;
				}
				var percent = parseInt( complete, 10 ) / total;
				var progress     = Math.round( percent * 100 ) + '%';
				var progress_bar = percent * 100;
			}
		},
		render: function () {
			var types = Object.keys( this.complete );
			var complete = 0;
			var total = 0;

			for (var i = types.length - 1; i >= 0; i--) {
				var type = types[i];
				this.updateProgress( type, this.complete[ type ], this.data.count[ type ] );

				complete += this.complete[ type ];
				total += this.data.count[ type ];
			}

			this.updateProgress( 'total', complete, total );
		}
	};

	AstraSitesAdmin = {

		installActivate : {},

		templateData: {},

		log_file        : '',
		customizer_data : '',
		wxr_url         : '',
		options_data    : '',
		widgets_data    : '',

		init: function()
		{
			this._resetPagedCount();
			this._bind();
		},

		/**
		 * Debugging.
		 * 
		 * @param  {mixed} data Mixed data.
		 */
		_log: function( data ) {
			
			if( astraSitesAdmin.debug ) {

				var date = new Date();
				var time = date.toLocaleTimeString();

				if (typeof data == 'object') { 
					console.log('%c ' + JSON.stringify( data ) + ' ' + time, 'background: #ededed; color: #444');
				} else {
					console.log('%c ' + data + ' ' + time, 'background: #ededed; color: #444');
				}


			}
		},

		/**
		 * Binds events for the Astra Sites.
		 *
		 * @since 1.0.0
		 * @access private
		 * @method _bind
		 */
		_bind: function()
		{
			$( document ).on('click'                     , '.astra-sites-site-details .import-content', AstraSitesAdmin._import_content);
			$( document ).on('click'                     , '.astra-sites-site-details .backup-options', AstraSitesAdmin._backup_options);
			$( document ).on('click'					 , '.devices button', AstraSitesAdmin._previewDevice);
			$( document ).on('click'                     , '.astra-sites-site-details .site-preview, .theme-browser .theme-screenshot, .theme-browser .more-details', AstraSitesAdmin._preview);
			$( document ).on('click'                     , '.theme-browser .install-theme-preview', AstraSitesAdmin._single_site_details);
			$( document ).on('click'                     , '.astra-sites-site-details .site-plugin-list', AstraSitesAdmin._single_site_required_plugins);
			$( document ).on('click'                     , '.astra-sites-site-details .install-plugins', AstraSitesAdmin._install_required_plugins);
			$( document ).on('click'                     , '.site-step-back-details', AstraSitesAdmin._single_site_back_details);
			$( document ).on('click'                     , '.site-step-plugin-list', AstraSitesAdmin._single_site_required_plugins);
			$( document ).on('click'                     , '#astra-sites-site-details .close', AstraSitesAdmin._toggle_site_details);
			$( document ).on('click'                     , '.next-theme', AstraSitesAdmin._nextTheme);
			$( document ).on('click'                     , '.previous-theme', AstraSitesAdmin._previousTheme);
			$( document ).on('click'                     , '.collapse-sidebar', AstraSitesAdmin._collapse);
			$( document ).on('click'                     , '.astra-demo-import', AstraSitesAdmin._importDemo);
			$( document ).on('click'                     , '.install-now', AstraSitesAdmin._installNow);
			$( document ).on('click'                     , '.close-full-overlay', AstraSitesAdmin._fullOverlay);
			$( document ).on('click'                     , '.activate-now', AstraSitesAdmin._activateNow);
			
			// $( document ).on('wp-plugin-installing'      , AstraSitesAdmin._pluginInstalling);
			// $( document ).on('wp-plugin-install-error'   , AstraSitesAdmin._installError);
			$( document ).on('wp-plugin-install-success' , AstraSitesAdmin._installSuccess);

			$( document ).on('astra-sites-import-set-site-data-done'       , AstraSitesAdmin._importCustomizerSettings );
			$( document ).on('astra-sites-import-customizer-settings-done' , AstraSitesAdmin._importPrepareXML );
			$( document ).on('astra-sites-import-xml-done'                 , AstraSitesAdmin._importSiteOptions );
			$( document ).on('astra-sites-import-options-done'             , AstraSitesAdmin._importWidgets );
			$( document ).on('astra-sites-import-widgets-done'             , AstraSitesAdmin._importEnd );
			
			$( document ).on('click', '.site-step-skip-goto-site-options', AstraSitesAdmin._site_step_skip_goto_site_options);
			$( document ).on('click', '.site-step-skip-show-content', AstraSitesAdmin._site_step_skip_show_content);

			$( document ).on('click', '.astra-sites-site-details .next', AstraSitesAdmin._nextSingleSite);
			$( document ).on('click', '.astra-sites-site-details .previous', AstraSitesAdmin._previousSingleSite);
		},

		/**
		 * Previous Theme.
		 */
		_previousSingleSite: function (event) {
			event.preventDefault();

			currentDemo = $('.theme-preview-on');
			currentDemo.removeClass('theme-preview-on');
			prevDemo = currentDemo.prev('.theme');
			prevDemo.addClass('theme-preview-on');

			AstraSitesAdmin._prepare_single_site_details( prevDemo );

			console.log( 'templateData' );
			console.log( AstraSitesAdmin.templateData );

			var template = wp.template('astra-sites-site-details');
			$( '#astra-sites-site-details' ).html( template( AstraSitesAdmin.templateData ) );
		},

		/**
		 * Next Theme.
		 */
		_nextSingleSite: function (event) {
			event.preventDefault();
			currentDemo = $('.theme-preview-on')
			currentDemo.removeClass('theme-preview-on');
			nextDemo = currentDemo.next('.theme');
			nextDemo.addClass('theme-preview-on');

			AstraSitesAdmin._prepare_single_site_details( nextDemo );

			console.log( 'templateData' );
			console.log( AstraSitesAdmin.templateData );

			var template = wp.template('astra-sites-site-details');
			$( '#astra-sites-site-details' ).html( template( AstraSitesAdmin.templateData ) );
		},

		_site_step_skip_show_content: function( event ) {
			event.preventDefault();
			var template = wp.template('astra-site-content');
			$( '#astra-sites-site-details' ).html( template( AstraSitesAdmin.templateData ) );

			console.log( AstraSitesAdmin.templateData.astra_demo_url + '/wp-json/wp/v2/pages' );
				
			// Replace ./data.json with your JSON feed
			fetch( 'http:' + AstraSitesAdmin.templateData.astra_demo_url + '/wp-json/wp/v2/pages' ).then(response => {
				return response.json();
			}).then(pages => {
				// Work with JSON pages here
				console.log(pages);

				$( '.page-list' ).html( '' );

				for ( key in pages ) {
					console.log( pages[ key ] );
					var output  = '<div class="page" data-page-id="'+pages[ key ].id+'">';
					    output += '    <div class="inner">';
					    output += '        <div class="title">'+pages[ key ].title.rendered+'</div>';
					    output += '        <img class="theme-screenshot" src="'+pages[ key ]['featured-image-url']+'">';
					    // output += '        <img class="theme-screenshot" src="http://s.wordpress.com/mshots/v1/'+pages[ key ].link+'?w=600">';
					    output += '        <span class="actions">';
					    output += '        	<input type="checkbox" name="page[]">';
				        output += '    		<a href="'+pages[ key ].link+'" target="_blank">Preview <i class="dashicons dashicons-external"></i></a>';
				        output += '    	</span>';
					    output += '    </div>';
					    output += '</div>';

					$( '.page-list' ).append( output );
				}

			}).catch(err => {
				// Do something for an error here
			});
		},

		_site_step_skip_goto_site_options: function( event ) {
			event.preventDefault();
			var template = wp.template('astra-site-options');
			$( '#astra-sites-site-details' ).html( template( AstraSitesAdmin.templateData ) );
		},

		_importEnd: function( event ) {

			$.ajax({
				url  : astraSitesAdmin.ajaxurl,
				type : 'POST',
				dataType: 'json',
				data : {
					action : 'astra-sites-import-end',
				},
				beforeSend: function() {
					$('.button-hero.astra-demo-import').text( astraSitesAdmin.log.importComplete );
				}
			})
			.fail(function( jqXHR ){
				AstraSitesAdmin._importFailMessage( jqXHR.status + ' ' + jqXHR.responseText );
				AstraSitesAdmin._log( jqXHR.status + ' ' + jqXHR.responseText );
		    })
			.done(function ( data ) {

				// 5. Fail - Import Complete.
				if( false === data.success ) {
					AstraSitesAdmin._importFailMessage( data.data );
					AstraSitesAdmin._log( data.data );
				} else {

					$('body').removeClass('importing-site');
					$('.previous-theme, .next-theme').removeClass('disabled');

					// 5. Pass - Import Complete.
					AstraSitesAdmin._importSuccessMessage();
					AstraSitesAdmin._log( astraSitesAdmin.log.success + ' ' + astraSitesAdmin.siteURL );
				}
			});
		},

		/**
		 * 4. Import Widgets.
		 */
		_importWidgets: function( event ) {

			$.ajax({
				url  : astraSitesAdmin.ajaxurl,
				type : 'POST',
				dataType: 'json',
				data : {
					action       : 'astra-sites-import-widgets',
					widgets_data : AstraSitesAdmin.widgets_data,
				},
				beforeSend: function() {
					AstraSitesAdmin._log( astraSitesAdmin.log.importWidgets );
					$('.button-hero.astra-demo-import').text( astraSitesAdmin.log.importingWidgets );
				},
			})
			.fail(function( jqXHR ){
				AstraSitesAdmin._importFailMessage( jqXHR.status + ' ' + jqXHR.responseText );
				AstraSitesAdmin._log( jqXHR.status + ' ' + jqXHR.responseText );
		    })
			.done(function ( widgets_data ) {

				// 4. Fail - Import Widgets.
				if( false === widgets_data.success ) {
					AstraSitesAdmin._importFailMessage( widgets_data.data );
					AstraSitesAdmin._log( widgets_data.data );

				} else {
					
					// 4. Pass - Import Widgets.
					AstraSitesAdmin._log( astraSitesAdmin.log.importWidgetsSuccess );
					$(document).trigger( 'astra-sites-import-widgets-done' );					
				}
			});
		},

		/**
		 * 3. Import Site Options.
		 */
		_importSiteOptions: function( event ) {

			$.ajax({
				url  : astraSitesAdmin.ajaxurl,
				type : 'POST',
				dataType: 'json',
				data : {
					action       : 'astra-sites-import-options',
					options_data : AstraSitesAdmin.options_data,
				},
				beforeSend: function() {
					AstraSitesAdmin._log( astraSitesAdmin.log.importOptions );
					$('.button-hero.astra-demo-import').text( astraSitesAdmin.log.importingOptions );
				},
			})
			.fail(function( jqXHR ){
				AstraSitesAdmin._importFailMessage( jqXHR.status + ' ' + jqXHR.responseText );
				AstraSitesAdmin._log( jqXHR.status + ' ' + jqXHR.responseText );
		    })
			.done(function ( options_data ) {

				// 3. Fail - Import Site Options.
				if( false === options_data.success ) {
					AstraSitesAdmin._log( options_data );
					AstraSitesAdmin._importFailMessage( options_data.data );
					AstraSitesAdmin._log( options_data.data );

				} else {

					// 3. Pass - Import Site Options.
					AstraSitesAdmin._log( astraSitesAdmin.log.importOptionsSuccess );
					$(document).trigger( 'astra-sites-import-options-done' );
				}
			});
		},

		/**
		 * 2. Prepare XML Data.
		 */
		_importPrepareXML: function( event ) {

			$.ajax({
				url  : astraSitesAdmin.ajaxurl,
				type : 'POST',
				dataType: 'json',
				data : {
					action  : 'astra-sites-import-prepare-xml',
					wxr_url : AstraSitesAdmin.wxr_url,
				},
				beforeSend: function() {
					AstraSitesAdmin._log( astraSitesAdmin.log.importXMLPrepare );
					$('.button-hero.astra-demo-import').text( astraSitesAdmin.log.importXMLPreparing );
				},
			})
			.fail(function( jqXHR ){
				AstraSitesAdmin._importFailMessage( jqXHR.status + ' ' + jqXHR.responseText );
				AstraSitesAdmin._log( jqXHR.status + ' ' + jqXHR.responseText );
		    })
			.done(function ( xml_data ) {

				// 2. Fail - Prepare XML Data.
				if( false === xml_data.success ) {
					AstraSitesAdmin._log( xml_data );
					var error_msg = xml_data.data.error || xml_data.data;
					AstraSitesAdmin._importFailMessage( error_msg );
					AstraSitesAdmin._log( error_msg );

				} else {

					// 2. Pass - Prepare XML Data.
					AstraSitesAdmin._log( astraSitesAdmin.log.importXMLPrepareSuccess );

					// Import XML though Event Source.
					AstraSSEImport.data = xml_data.data;
					AstraSSEImport.render();

					AstraSitesAdmin._log( astraSitesAdmin.log.importXML );
					$('.button-hero.astra-demo-import').text( astraSitesAdmin.log.importingXML );
					
					var evtSource = new EventSource( AstraSSEImport.data.url );
					evtSource.onmessage = function ( message ) {
						var data = JSON.parse( message.data );
						switch ( data.action ) {
							case 'updateDelta':
									AstraSSEImport.updateDelta( data.type, data.delta );
								break;

							case 'complete':
								evtSource.close();

								// 2. Pass - Import XML though "Source Event".
								AstraSitesAdmin._log( astraSitesAdmin.log.importXMLSuccess );
								AstraSitesAdmin._log( '----- SSE - XML import Complete -----' );

								$(document).trigger( 'astra-sites-import-xml-done' );

								break;
						}
					};
					evtSource.addEventListener( 'log', function ( message ) {
						var data = JSON.parse( message.data );
						AstraSitesAdmin._log( data.level + ' ' + data.message );
					});
				}
			});
		},

		/**
		 * 1. Import Customizer Options.
		 */
		_importCustomizerSettings: function( event ) {

			$.ajax({
				url  : astraSitesAdmin.ajaxurl,
				type : 'POST',
				dataType: 'json',
				data : {
					action          : 'astra-sites-import-customizer-settings',
					customizer_data : AstraSitesAdmin.customizer_data,
				},
				beforeSend: function() {
					AstraSitesAdmin._log( astraSitesAdmin.log.importCustomizer );
					$('.button-hero.astra-demo-import').text( astraSitesAdmin.log.importingCustomizer );
				},
			})
			.fail(function( jqXHR ){
				AstraSitesAdmin._importFailMessage( jqXHR.status + ' ' + jqXHR.responseText );
				AstraSitesAdmin._log( jqXHR.status + ' ' + jqXHR.responseText );
		    })
			.done(function ( customizer_data ) {

				// 1. Fail - Import Customizer Options.
				if( false === customizer_data.success ) {
					AstraSitesAdmin._importFailMessage( customizer_data.data );
					AstraSitesAdmin._log( customizer_data.data );
				} else {

					// 1. Pass - Import Customizer Options.
					AstraSitesAdmin._log( astraSitesAdmin.log.importCustomizerSuccess );

					$(document).trigger( 'astra-sites-import-customizer-settings-done' );
				}
			});
		},

		_import_content: function( event ) {
			event.preventDefault();

			var selected_pages = $('.page-list input:checkbox:checked');

			console.log( selected_pages.length );
			if( selected_pages.length ) {

				// Activate ALl Plugins.
				AstraSitesAjaxQueue.stop();
				AstraSitesAjaxQueue.run();

				selected_pages.each(function(index, element) {
					console.log( element );
					var	parent = $(element).parents('.page');
					var	page_id = parent.data('page-id');
					console.log( page_id );

					parent.find( 'input' ).hide();
					parent.find( '.actions' ).prepend( '<span class="spinner is-active" style="margin: 0;text-align: left;padding-left: 2em;font-style: italic;">Creating..</span>' );


					if( page_id ) {
						// Replace ./data.json with your JSON feed
						fetch( 'http:' + AstraSitesAdmin.templateData.astra_demo_url + '/wp-json/wp/v2/pages/' + page_id ).then(response => {
							return response.json();
						}).then(data => {

							// Work with JSON page here
							console.log(data);

							// Send to AJAX.
							AstraSitesAjaxQueue.add({
								url: astraSitesAdmin.ajaxurl,
								type: 'POST',
								data: {
									'action' : 'astra-sites-create-pages',
									'data'   : data,
								},
								success: function( data ) {

									var remote_page_id = data.data['remove-page-id'];
									console.log( data );
									console.log( data.data['id'] );
									console.log( data.data['link'] );
									console.log( data.data['remove-page-id'] );

									if( data.success ) {
										if( $('.page[data-page-id="'+remote_page_id+'"]').length ) {
											$('.page[data-page-id="'+remote_page_id+'"]').find('.actions .spinner').remove();
											$('.page[data-page-id="'+remote_page_id+'"]').find('.actions').prepend( '<span class="page-imported" style="text-align: left;"><i class="dashicons dashicons-yes"></i> Created!</span>' );
		
											setTimeout(function() {
												$('.page[data-page-id="'+remote_page_id+'"]').find('.actions .page-imported').remove();
												$('.page[data-page-id="'+remote_page_id+'"]').find('.actions').prepend( '<a href="'+data.data['link']+'" target="_blank">See <i class="dashicons dashicons-external"></i></a>' );
											}, 1000);
										}

									}
								}
							});

						}).catch(err => {
							// Do something for an error here
						});
					}
				});

			} else {
				console.log( 'Please select pages..' );
			}




			

			


			// // Activate ALl Plugins.
			// AstraSitesAjaxQueue.stop();
			// AstraSitesAjaxQueue.run();
			// $.each( '.page-list .page', function(index, page) {
			// AstraSitesAjaxQueue.add({
			// 	url: astraSitesAdmin.ajaxurl,
			// 	type: 'POST',
			// 	data: {
			// 		'action' : 'astra-sites-create-pages',
			// 		'id'     : $(page).data('page-id') || '',
			// 		// 'options'           : $siteOptions,
			// 		// 'enabledExtensions' : $enabledExtensions,
			// 	},
			// 	success: function( result ) {
			// 		console.log( result );
			// 	}
			// });
			// 
			// 
			// 
			// ========
			// 
			// 
			// 
			// $.ajax({
			// 	url: astraSitesAdmin.ajaxurl,
			// 	type: 'POST',
			// 	data: {
			// 		'action' : 'astra-sites-create-pages',
			// 	},
			// })
			// .done(function (data) {
			// 	// download( data, 'backup-options.json', 'application/json' );

			// 	// setTimeout( function() {
			// 	// 	btn.text( 'Import Options' );
			// 	// 	btn.removeClass( 'backup-options' );
			// 	// 	btn.addClass( 'import-options' );
			// 	// }, 500 );
			// });

		},

		_backup_options: function( event ) {
			event.preventDefault();

			var btn = $(this);

			$.ajax({
				url: astraSitesAdmin.ajaxurl,
				type: 'POST',
				data: {
					'action' : 'astra-sites-backup-options',
				},
			})
			.done(function (data) {
				download( data, 'backup-options.json', 'application/json' );

				setTimeout( function() {
					btn.text( 'Import Options' );
					btn.removeClass( 'backup-options' );
					btn.addClass( 'import-options' );
				}, 500 );
			});

		},

		/**
		 * Import Success Button.
		 * 
		 * @param  {string} data Error message.
		 */
		_importSuccessMessage: function() {

			$('.astra-demo-import').removeClass('updating-message installing')
				.removeAttr('data-import')
				.addClass('view-site')
				.removeClass('astra-demo-import')
				.text( astraSitesAdmin.strings.viewSite )
				.attr('target', '_blank')
				.append('<i class="dashicons dashicons-external"></i>')
				.attr('href', astraSitesAdmin.siteURL );
		},

		/**
		 * Preview Device
		 */
		_previewDevice: function( event ) {
			var device = $( event.currentTarget ).data( 'device' );

			$('.theme-install-overlay')
				.removeClass( 'preview-desktop preview-tablet preview-mobile' )
				.addClass( 'preview-' + device )
				.data( 'current-preview-device', device );

			AstraSitesAdmin._tooglePreviewDeviceButtons( device );
		},

		/**
		 * Toggle Preview Buttons
		 */
		_tooglePreviewDeviceButtons: function( newDevice ) {
			var $devices = $( '.wp-full-overlay-footer .devices' );

			$devices.find( 'button' )
				.removeClass( 'active' )
				.attr( 'aria-pressed', false );

			$devices.find( 'button.preview-' + newDevice )
				.addClass( 'active' )
				.attr( 'aria-pressed', true );
		},

		/**
		 * Import Error Button.
		 * 
		 * @param  {string} data Error message.
		 */
		_importFailMessage: function( message, from ) {

			$('.astra-demo-import')
				.addClass('go-pro button-primary')
				.removeClass('updating-message installing')
				.removeAttr('data-import')
				.attr('target', '_blank')
				.append('<i class="dashicons dashicons-external"></i>')
				.removeClass('astra-demo-import');

			// Add the doc link due to import log file not generated.
			if( 'undefined' === from ) {

				$('.wp-full-overlay-header .go-pro').text( astraSitesAdmin.strings.importFailedBtnSmall );
				$('.wp-full-overlay-footer .go-pro').text( astraSitesAdmin.strings.importFailedBtnLarge );
				$('.go-pro').attr('href', astraSitesAdmin.log.serverConfiguration );

			// Add the import log file link.
			} else {
				
				$('.wp-full-overlay-header .go-pro').text( astraSitesAdmin.strings.importFailBtn );
				$('.wp-full-overlay-footer .go-pro').text( astraSitesAdmin.strings.importFailBtnLarge )
				
				// Add the import log file link.
				if( 'undefined' !== AstraSitesAdmin.log_file_url ) {
					$('.go-pro').attr('href', AstraSitesAdmin.log_file_url );
				} else {
					$('.go-pro').attr('href', astraSitesAdmin.log.serverConfiguration );
				}
			}

			var output  = '<div class="astra-api-error notice notice-error notice-alt is-dismissible">';
				output += '	<p>'+message+'</p>';
				output += '	<button type="button" class="notice-dismiss">';
				output += '		<span class="screen-reader-text">'+commonL10n.dismiss+'</span>';
				output += '	</button>';
				output += '</div>';

			// Fail Notice.
			$('.install-theme-info').append( output );
			

			// !important to add trigger.
			// Which reinitialize the dismiss error message events.
			$(document).trigger('wp-updates-notice-added');
		},


		/**
		 * Install Now
		 */
		_installNow: function(event)
		{
			event.preventDefault();

			var $button 	= jQuery( event.target ),
				$document   = jQuery(document);

			if ( $button.hasClass( 'updating-message' ) || $button.hasClass( 'button-disabled' ) ) {
				return;
			}

			if ( wp.updates.shouldRequestFilesystemCredentials && ! wp.updates.ajaxLocked ) {
				wp.updates.requestFilesystemCredentials( event );

				$document.on( 'credential-modal-cancel', function() {
					var $message = $( '.install-now.updating-message' );

					$message
						.removeClass( 'updating-message' )
						.text( wp.updates.l10n.installNow );

					wp.a11y.speak( wp.updates.l10n.updateCancel, 'polite' );
				} );
			}

			AstraSitesAdmin._log( astraSitesAdmin.log.installingPlugin + ' ' + $button.data( 'slug' ) );

			wp.updates.installPlugin( {
				slug:    $button.data( 'slug' )
			} );
		},

		/**
		 * Install Success
		 */
		_installSuccess: function( event, response ) {

			event.preventDefault();

			// activateUrl: "http://localhost/dev.fresh/wp-admin/plugins.php?_wpnonce=fddbfd7887&action=activate&plugin=contact-form-7/wp-contact-form-7.php"
			// install: "plugin"
			// pluginName: "Contact Form 7"
			// slug: "contact-form-7"
			var currentItem = $('.required-plugins').find('[data-slug="'+response.slug+'"]');
			var $init = currentItem.attr('data-init') || '';

			console.log( 'plugin installed' );
			console.log( response );

			console.log( '$init' );
			console.log( $init );

			// AstraSitesAdmin._log( astraSitesAdmin.log.installed + ' ' + response.slug );

			// var $message     = $( '.plugin-card-' + response.slug ).find( '.button' );
			// var $siteOptions = $( '.wp-full-overlay-header').find('.astra-site-options').val();
			// var $enabledExtensions = $( '.wp-full-overlay-header').find('.astra-enabled-extensions').val();

			// Transform the 'Install' button into an 'Activate' button.
			// var $init = $message.data('init');

			// $message.removeClass( 'install-now installed button-disabled updated-message' )
			// 	.addClass('updating-message')
			// 	.html( astraSitesAdmin.strings.btnActivating );

			// Reset not installed plugins list.
			// var pluginsList = astraSitesAdmin.requiredPlugins.notinstalled;
			// astraSitesAdmin.requiredPlugins.notinstalled = AstraSitesAdmin._removePluginFromQueue( response.slug, pluginsList );

			// WordPress adds "Activate" button after waiting for 1000ms. So we will run our activation after that.
			setTimeout( function() {

				$.ajax({
					url: astraSitesAdmin.ajaxurl,
					type: 'POST',
					data: {
						'action'            : 'astra-required-plugin-activate-new',
						'init'              : $init,
						// 'options'           : $siteOptions,
						// 'enabledExtensions' : $enabledExtensions,
					},
				})
				.done(function (result) {

					if( result.success ) {

						currentItem.find( '.dashicons').removeClass('notinstalled dashicons-update updating-message' ).addClass('dashicons-yes');

						if( ! $('.required-plugins').find( '.dashicons-update').length ) {

							var template = wp.template('astra-site-options');
							$( '#astra-sites-site-details' ).html( template( AstraSitesAdmin.templateData ) );

							console.log( '--- JABA --- installing plugins' );
						}
						// var pluginsList = astraSitesAdmin.requiredPlugins.inactive;

						// // Reset not installed plugins list.
						// astraSitesAdmin.requiredPlugins.inactive = AstraSitesAdmin._removePluginFromQueue( response.slug, pluginsList );

						// $message.removeClass( 'button-primary install-now activate-now updating-message' )
						// 	.attr('disabled', 'disabled')
						// 	.addClass('disabled')
						// 	.text( astraSitesAdmin.strings.btnActive );

						// // Enable Demo Import Button
						// AstraSitesAdmin._enable_demo_import_button();

					// } else {

					// 	$message.removeClass( 'updating-message' );

					}

				});

			}, 1200 );

		},

		/**
		 * Plugin Installation Error.
		 */
		_installError: function( event, response ) {

			var $card = jQuery( '.plugin-card-' + response.slug );

			AstraSitesAdmin._log( response.errorMessage + ' ' + response.slug );

			$card
				.removeClass( 'button-primary' )
				.addClass( 'disabled' )
				.html( wp.updates.l10n.installFailedShort );

			AstraSitesAdmin._importFailMessage( response.errorMessage );
		},

		/**
		 * Installing Plugin
		 */
		_pluginInstalling: function(event, args) {
			event.preventDefault();

			// var $card = $( '.plugin-card-' + args.slug );
			// var $button = $card.find( '.button' );

			// AstraSitesAdmin._log( astraSitesAdmin.log.installingPlugin + ' ' + args.slug );

			$card.addClass('updating-message');
			$button.addClass('already-started');

		},

		/**
		 * Render Demo Preview
		 */
		_activateNow: function( eventn ) {

			event.preventDefault();

			var $button = jQuery( event.target ),
				$init 	= $button.data( 'init' ),
				$slug 	= $button.data( 'slug' );

			if ( $button.hasClass( 'updating-message' ) || $button.hasClass( 'button-disabled' ) ) {
				return;
			}

			AstraSitesAdmin._log( astraSitesAdmin.log.activating + ' ' + $slug );

			$button.addClass('updating-message button-primary')
				.html( astraSitesAdmin.strings.btnActivating );

			var $siteOptions = jQuery( '.wp-full-overlay-header').find('.astra-site-options').val();
			var $enabledExtensions = jQuery( '.wp-full-overlay-header').find('.astra-enabled-extensions').val();

			$.ajax({
				url: astraSitesAdmin.ajaxurl,
				type: 'POST',
				data: {
					'action'            : 'astra-required-plugin-activate',
					'init'              : $init,
					'options'           : $siteOptions,
					'enabledExtensions' : $enabledExtensions,
				},
			})
			.done(function (result) {

				if( result.success ) {

					AstraSitesAdmin._log( astraSitesAdmin.log.activated + ' ' + $slug );

					var pluginsList = astraSitesAdmin.requiredPlugins.inactive;

					// Reset not installed plugins list.
					astraSitesAdmin.requiredPlugins.inactive = AstraSitesAdmin._removePluginFromQueue( $slug, pluginsList );

					$button.removeClass( 'button-primary install-now activate-now updating-message' )
						.attr('disabled', 'disabled')
						.addClass('disabled')
						.text( astraSitesAdmin.strings.btnActive );

					// Enable Demo Import Button
					AstraSitesAdmin._enable_demo_import_button();

				}

			})
			.fail(function () {
			});

		},

		/**
		 * Full Overlay
		 */
		_fullOverlay: function (event) {
			event.preventDefault();

			// Import process is started?
			// And Closing the window? Then showing the warning confirm message.
			if( $('body').hasClass('importing-site') && ! confirm( astraSitesAdmin.strings.warningBeforeCloseWindow ) ) {
				return;
			}

			$('body').removeClass('importing-site');
			$('.previous-theme, .next-theme').removeClass('disabled');
			$('.theme-install-overlay').css('display', 'none');
			$('.theme-install-overlay').remove();
			$('.theme-preview-on').removeClass('theme-preview-on');
			$('html').removeClass('astra-site-preview-on');
		},

		/**
		 * Bulk Plugin Active & Install
		 */
		_bulkPluginInstallActivate: function()
		{
			if( 0 === astraSitesAdmin.requiredPlugins.length ) {
				return;
			}

			jQuery('.required-plugins')
				.find('.install-now')
				.addClass( 'updating-message' )
				.removeClass( 'install-now' )
				.text( wp.updates.l10n.installing );

			jQuery('.required-plugins')
				.find('.activate-now')
				.addClass('updating-message')
				.removeClass( 'activate-now' )
				.html( astraSitesAdmin.strings.btnActivating );

			var not_installed 	 = astraSitesAdmin.requiredPlugins.notinstalled || '';
			var activate_plugins = astraSitesAdmin.requiredPlugins.inactive || '';

			// First Install Bulk.
			if( not_installed.length > 0 ) {
				AstraSitesAdmin._installAllPlugins( not_installed );
			}

			// Second Activate Bulk.
			if( activate_plugins.length > 0 ) {
				AstraSitesAdmin._activateAllPlugins( activate_plugins );
			}

		},

		/**
		 * Activate All Plugins.
		 */
		_activateAllPlugins: function( activate_plugins ) {

			// Activate ALl Plugins.
			AstraSitesAjaxQueue.stop();
			AstraSitesAjaxQueue.run();

			AstraSitesAdmin._log( astraSitesAdmin.log.bulkActivation );

			$.each( activate_plugins, function(index, single_plugin) {

				// var $card    	 = jQuery( '.plugin-card-' + single_plugin.slug ),
				// 	$button  	 = $card.find('.button'),
				// 	$siteOptions = jQuery( '.wp-full-overlay-header').find('.astra-site-options').val(),
				// 	$enabledExtensions = jQuery( '.wp-full-overlay-header').find('.astra-enabled-extensions').val();

				// $button.addClass('updating-message');

				AstraSitesAjaxQueue.add({
					url: astraSitesAdmin.ajaxurl,
					type: 'POST',
					data: {
						'action'            : 'astra-required-plugin-activate-new',
						'init'              : single_plugin.init,
						// 'options'           : $siteOptions,
						// 'enabledExtensions' : $enabledExtensions,
					},
					success: function( result ) {

						console.log( result );

						if( result.success ) {

							var currentItem = $('.required-plugins').find('[data-slug="'+single_plugin.slug+'"]');
							var $init = currentItem.attr('data-init') || '';

							currentItem.find( '.dashicons').removeClass('inactive dashicons-update updating-message' ).addClass('dashicons-yes');

							console.log( 'plugin activated' );
							console.log( result );

							console.log( '$init' );
							console.log( $init );

							if( ! $('.required-plugins').find( '.dashicons-update').length ) {
								var template = wp.template('astra-site-options');
								$( '#astra-sites-site-details' ).html( template( AstraSitesAdmin.templateData ) );
								console.log( '--- JABA --- activating plugins' );
							}

							// 	AstraSitesAdmin._log( astraSitesAdmin.log.activate + ' ' + single_plugin.slug );

							// 	var $card = jQuery( '.plugin-card-' + single_plugin.slug );
							// 	var $button = $card.find( '.button' );
							// 	if( ! $button.hasClass('already-started') ) {
							// 		var pluginsList = astraSitesAdmin.requiredPlugins.inactive;

							// 		// Reset not installed plugins list.
							// 		astraSitesAdmin.requiredPlugins.inactive = AstraSitesAdmin._removePluginFromQueue( single_plugin.slug, pluginsList );
							// 	}

							// 	$button.removeClass( 'button-primary install-now activate-now updating-message' )
							// 		.attr('disabled', 'disabled')
							// 		.addClass('disabled')
							// 		.text( astraSitesAdmin.strings.btnActive );

							// 	// Enable Demo Import Button
							// 	AstraSitesAdmin._enable_demo_import_button();
							// } else {
							// 	AstraSitesAdmin._log( astraSitesAdmin.log.activationError + ' - ' + single_plugin.slug );
						}
					}
				});
			});
		},

		/**
		 * Install All Plugins.
		 */
		_installAllPlugins: function( not_installed ) {

			AstraSitesAdmin._log( astraSitesAdmin.log.bulkInstall );
			
			$.each( not_installed, function(index, single_plugin) {

				// var $card   = jQuery( '.plugin-card-' + single_plugin.slug ),
				// 	$button = $card.find('.button');

				// if( ! $button.hasClass('already-started') ) {

					// Add each plugin activate request in Ajax queue.
					// @see wp-admin/js/updates.js
					wp.updates.queue.push( {
						action: 'install-plugin', // Required action.
						data:   {
							slug: single_plugin.slug
						}
					} );
				// }
			});

			// Required to set queue.
			wp.updates.queueChecker();
		},

		/**
		 * Fires when a nav item is clicked.
		 *
		 * @since 1.0
		 * @access private
		 * @method _importDemo
		 */
		_importDemo: function()
		{
			var $this 	= jQuery(this),
				$theme  = $this.closest('.astra-sites-preview').find('.wp-full-overlay-header'),
				apiURL  = $theme.data('demo-api') || '',
				plugins = $theme.data('required-plugins');

			var disabled = $this.attr('data-import');

			if ( typeof disabled !== 'undefined' && disabled === 'disabled' || $this.hasClass('disabled') ) {

				$('.astra-demo-import').addClass('updating-message installing')
					.text( wp.updates.l10n.installing );

				/**
				 * Process Bulk Plugin Install & Activate
				 */
				AstraSitesAdmin._bulkPluginInstallActivate();

				return;
			}

			// Proceed?
			if( ! confirm( astraSitesAdmin.strings.importWarning ) ) {
				return;
			}

			$('body').addClass('importing-site');
			$('.previous-theme, .next-theme').addClass('disabled');

			// Remove all notices before import start.
			$('.install-theme-info > .notice').remove();

			$('.astra-demo-import').attr('data-import', 'disabled')
				.addClass('updating-message installing')
				.text( astraSitesAdmin.strings.importingDemo );

			$this.closest('.theme').focus();

			var $theme = $this.closest('.astra-sites-preview').find('.wp-full-overlay-header');

			var apiURL = $theme.data('demo-api') || '';
			
			// Site Import by API URL.
			if( apiURL ) {
				AstraSitesAdmin._importSite( apiURL );
			}

		},

		/**
		 * Start Import Process by API URL.
		 * 
		 * @param  {string} apiURL Site API URL.
		 */
		_importSite: function( apiURL ) {

			AstraSitesAdmin._log( astraSitesAdmin.log.api + ' : ' + apiURL );
			AstraSitesAdmin._log( astraSitesAdmin.log.importing );

			$('.button-hero.astra-demo-import').text( astraSitesAdmin.log.gettingData );

			// 1. Request Site Import
			$.ajax({
				url  : astraSitesAdmin.ajaxurl,
				type : 'POST',
				dataType: 'json',
				data : {
					'action'  : 'astra-sites-import-set-site-data',
					'api_url' : apiURL,
				},
			})
			.fail(function( jqXHR ){
				AstraSitesAdmin._importFailMessage( jqXHR.status + ' ' + jqXHR.responseText );
				AstraSitesAdmin._log( jqXHR.status + ' ' + jqXHR.responseText );
		    })
			.done(function ( demo_data ) {

				// 1. Fail - Request Site Import
				if( false === demo_data.success ) {

					AstraSitesAdmin._importFailMessage( demo_data.data );

				} else {

					// Set log file URL.
					if( 'log_file' in demo_data.data ){
						AstraSitesAdmin.log_file_url  = decodeURIComponent( demo_data.data.log_file ) || '';
					}

					// 1. Pass - Request Site Import
					AstraSitesAdmin._log( astraSitesAdmin.log.processingRequest );

					AstraSitesAdmin.customizer_data = JSON.stringify( demo_data.data['astra-site-customizer-data'] ) || '';
					AstraSitesAdmin.wxr_url         = encodeURI( demo_data.data['astra-site-wxr-path'] ) || '';
					AstraSitesAdmin.options_data    = JSON.stringify( demo_data.data['astra-site-options-data'] ) || '';
					AstraSitesAdmin.widgets_data    = JSON.stringify( demo_data.data['astra-site-widgets-data'] ) || '';

					$(document).trigger( 'astra-sites-import-set-site-data-done' );
				}
			
			});

		},

		/**
		 * Collapse Sidebar.
		 */
		_collapse: function() {
			event.preventDefault();

			overlay = jQuery('.wp-full-overlay');

			if (overlay.hasClass('expanded')) {
				overlay.removeClass('expanded');
				overlay.addClass('collapsed');
				return;
			}

			if (overlay.hasClass('collapsed')) {
				overlay.removeClass('collapsed');
				overlay.addClass('expanded');
				return;
			}
		},

		/**
		 * Previous Theme.
		 */
		_previousTheme: function (event) {
			event.preventDefault();

			currentDemo = jQuery('.theme-preview-on');
			currentDemo.removeClass('theme-preview-on');
			prevDemo = currentDemo.prev('.theme');
			prevDemo.addClass('theme-preview-on');

			AstraSitesAdmin._renderDemoPreview(prevDemo);
		},

		/**
		 * Next Theme.
		 */
		_nextTheme: function (event) {
			event.preventDefault();
			currentDemo = jQuery('.theme-preview-on')
			currentDemo.removeClass('theme-preview-on');
			nextDemo = currentDemo.next('.theme');
			nextDemo.addClass('theme-preview-on');

			AstraSitesAdmin._renderDemoPreview( nextDemo );
		},

		_toggle_site_details: function() {
			$('#astra-sites-site-details').hide();
			$('#astra-sites-grid').show();
		},

		/**
		 * Individual Site Preview
		 *
		 * On click on image, more link & preview button.
		 */
		_install_required_plugins: function( event ) {
			event.preventDefault();

			console.log( AstraSitesAdmin.templateData.required_plugins );
			console.log( JSON.stringify(AstraSitesAdmin.templateData.required_plugins) );

			$('.required-plugins').find( '.inactive, .notinstalled' ).addClass('dashicons-update updating-message').removeClass('dashicons-arrow-right');

			// console.log( AstraSitesAdmin.installActivate );
			// console.log( AstraSitesAdmin.installActivate.notinstalled );
			// console.log( AstraSitesAdmin.installActivate.inactive );

			var not_installed 	 = AstraSitesAdmin.installActivate.notinstalled || '';
			var activate_plugins = AstraSitesAdmin.installActivate.inactive || '';
			// console.log( 'not_installed' );
			// console.log( not_installed );

			// console.log( 'activate_plugins' );
			// console.log( activate_plugins );
			// return;

			console.log( not_installed.length );
			console.log( activate_plugins.length );
			if( 0 == not_installed.length && activate_plugins.length == 0 ) {
				console.log( 'yes' );
				var template = wp.template('astra-site-options');
				$( '#astra-sites-site-details' ).html( template( AstraSitesAdmin.templateData ) );
			} else {
				// First Install Bulk.
				if( not_installed.length > 0 ) {
					AstraSitesAdmin._installAllPlugins( not_installed );
				}

				// Second Activate Bulk.
				if( activate_plugins.length > 0 ) {
					AstraSitesAdmin._activateAllPlugins( activate_plugins );
				}
			}

		},

		_single_site_required_plugins: function( event ) {
			event.preventDefault();

			var template = wp.template('astra-site-required-plugins-list');
			$( '#astra-sites-site-details' ).html( template( AstraSitesAdmin.templateData ) );

			console.log( AstraSitesAdmin.templateData.required_plugins );
			console.log( JSON.stringify(AstraSitesAdmin.templateData.required_plugins) );

			$('.required-plugins').addClass('loading').html('<span class="spinner is-active"></span>');

			var data = {
						action           : 'astra-required-plugins',
						_ajax_nonce      : astraSitesAdmin._ajax_nonce,
						required_plugins : AstraSitesAdmin.templateData.required_plugins
					};

			// Required Required.
			$.ajax({
				url  : astraSitesAdmin.ajaxurl,
				type : 'POST',
				data : data,
			})
			.fail(function( jqXHR ){

				// Remove loader.
				$('.required-plugins').removeClass('loading').html('');

				AstraSitesAdmin._importFailMessage( jqXHR.status + ' ' + jqXHR.responseText, 'plugins' );
				AstraSitesAdmin._log( jqXHR.status + ' ' + jqXHR.responseText );
			})
			.done(function ( response ) {

				console.log( 'here im' );
				console.log( response.data );

				AstraSitesAdmin.installActivate = response.data;

				// Release disabled class from import button.
				$('.astra-demo-import')
					.removeClass('disabled not-click-able')
					.attr('data-import', 'disabled');

				// Remove loader.
				$('.required-plugins').removeClass('loading').html('');

				/**
				 * Count remaining plugins.
				 * @type number
				 */
				var remaining_plugins = 0;

				console.log( 'new' );
				console.log( response );

				var template = wp.template('astra-site-required-plugins');
				$('.required-plugins').html( template( response ) );

				// /**
				//  * Not Installed
				//  *
				//  * List of not installed required plugins.
				//  */
				// if ( typeof response.data.notinstalled !== 'undefined' ) {

				// 	// Add not have installed plugins count.
				// 	remaining_plugins += parseInt( response.data.notinstalled.length );

				// 	$( response.data.notinstalled ).each(function( index, plugin ) {

				// 		var output  = '<div class="plugin-card ';
				// 			output += ' 		plugin-card-'+plugin.slug+'"';
				// 			output += ' 		data-slug="'+plugin.slug+'"';
				// 			output += ' 		data-init="'+plugin.init+'">';
				// 			output += '	<span class="dashicons dashicons-arrow-right"></span>';
				// 			output += '	<span class="title">'+plugin.name+'</span>';
				// 			// output += '	<button class="button install-now"';
				// 			// output += '			data-init="' + plugin.init + '"';
				// 			// output += '			data-slug="' + plugin.slug + '"';
				// 			// output += '			data-name="' + plugin.name + '">';
				// 			// output += 	wp.updates.l10n.installNow;
				// 			// output += '	</button>';
				// 			// output += '	<span class="dashicons-no dashicons"></span>';
				// 			output += '</div>';

				// 		$('.required-plugins').append(output);

				// 	});
				// }

				// /**
				//  * Inactive
				//  *
				//  * List of not inactive required plugins.
				//  */
				// if ( typeof response.data.inactive !== 'undefined' ) {

				// 	// Add inactive plugins count.
				// 	remaining_plugins += parseInt( response.data.inactive.length );

				// 	$( response.data.inactive ).each(function( index, plugin ) {

				// 		var output  = '<div class="plugin-card ';
				// 			output += ' 		plugin-card-'+plugin.slug+'"';
				// 			output += ' 		data-slug="'+plugin.slug+'"';
				// 			output += ' 		data-init="'+plugin.init+'">';
				// 			output += '	<span class="dashicons dashicons-arrow-right"></span>';
				// 			output += '	<span class="title">'+plugin.name+'</span>';
				// 			// output += '	<button class="button activate-now button-primary"';
				// 			// output += '		data-init="' + plugin.init + '"';
				// 			// output += '		data-slug="' + plugin.slug + '"';
				// 			// output += '		data-name="' + plugin.name + '">';
				// 			// output += 	wp.updates.l10n.activatePlugin;
				// 			// output += '	</button>';
				// 			// output += '	<span class="dashicons-no dashicons"></span>';
				// 			output += '</div>';

				// 		$('.required-plugins').append(output);

				// 	});
				// }

				// /**
				//  * Active
				//  *
				//  * List of not active required plugins.
				//  */
				// if ( typeof response.data.active !== 'undefined' ) {

				// 	$( response.data.active ).each(function( index, plugin ) {

				// 		var output  = '<div class="plugin-card ';
				// 			output += ' 		plugin-card-'+plugin.slug+'"';
				// 			output += ' 		data-slug="'+plugin.slug+'"';
				// 			output += ' 		data-init="'+plugin.init+'">';
				// 			output += '	<span class="dashicons dashicons-arrow-right"></span>';
				// 			output += '	<span class="title">'+plugin.name+'</span>';
				// 			// output += '	<button class="button disabled"';
				// 			// output += '			data-slug="' + plugin.slug + '"';
				// 			// output += '			data-name="' + plugin.name + '">';
				// 			// output += astraSitesAdmin.strings.btnActive;
				// 			// output += '	</button>';
				// 			// output += '	<span class="dashicons-yes dashicons"></span>';
				// 			output += '</div>';

				// 		$('.required-plugins').append(output);

				// 	});
				// }

				// /**
				//  * Enable Demo Import Button
				//  * @type number
				//  */
				// astraSitesAdmin.requiredPlugins = response.data;
				// AstraSitesAdmin._enable_demo_import_button();

			});

			// AstraSitesAdmin._renderDemoPreview( self );

		},

		_single_site_back_details: function( event ) {
			event.preventDefault();

			var template = wp.template('astra-sites-site-details');
			$( '#astra-sites-site-details' ).html( template( AstraSitesAdmin.templateData ) );

		},

		_prepare_single_site_details: function( self ) {
			var demoId             	   = self.data('id') || '',
				apiURL                 = self.data('demo-api') || '',
				demoType               = self.data('demo-type') || '',
				demoURL                = self.data('demo-url') || '',
				screenshot             = self.data('screenshot') || '',
				demo_name              = self.data('demo-name') || '',
				demo_slug              = self.data('demo-slug') || '',
				content                = self.data('content') || '',
				requiredPlugins        = self.data('required-plugins') || '',
				astraSiteOptions       = self.find('.astra-site-options').val() || '',
				astraEnabledExtensions = self.find('.astra-enabled-extensions').val() || '';

			AstraSitesAdmin.templateData = {
				id                       : demoId,
				astra_demo_type          : demoType,
				astra_demo_url           : demoURL,
				demo_api                 : apiURL,
				screenshot               : screenshot,
				demo_name                : demo_name,
				slug                     : demo_slug,
				content                  : content,
				required_plugins         : JSON.stringify(requiredPlugins),
				astra_site_options       : astraSiteOptions,
				astra_enabled_extensions : astraEnabledExtensions,
			};
		},

		_single_site_details: function( event ) {

			event.preventDefault();

			$('#astra-sites-site-details').show();
			$('#astra-sites-grid').hide();
			
			var self = $(this).parents('.theme');

			self.addClass('theme-preview-on');

			AstraSitesAdmin._prepare_single_site_details( self );

			console.log( 'templateData' );
			console.log( AstraSitesAdmin.templateData );

			var template = wp.template('astra-sites-site-details');
			$( '#astra-sites-site-details' ).html( template( AstraSitesAdmin.templateData ) );

		},

		/**
		 * Individual Site Preview
		 *
		 * On click on image, more link & preview button.
		 */
		_preview: function( event ) {

			event.preventDefault();

			$('#astra-sites-site-details').hide();
			$('#astra-sites-grid').show();

			var self = jQuery(this).parents('.theme');
			self.addClass('theme-preview-on');

			$('html').addClass('astra-site-preview-on');

			AstraSitesAdmin._renderDemoPreview( self );
		},

		/**
		 * Check Next Previous Buttons.
		 */
		_checkNextPrevButtons: function() {
			currentDemo = jQuery('.theme-preview-on');
			nextDemo = currentDemo.nextAll('.theme').length;
			prevDemo = currentDemo.prevAll('.theme').length;

			if (nextDemo == 0) {
				jQuery('.next-theme').addClass('disabled');
			} else if (nextDemo != 0) {
				jQuery('.next-theme').removeClass('disabled');
			}

			if (prevDemo == 0) {
				jQuery('.previous-theme').addClass('disabled');
			} else if (prevDemo != 0) {
				jQuery('.previous-theme').removeClass('disabled');
			}

			return;
		},

		/**
		 * Render Demo Preview
		 */
		_renderDemoPreview: function(anchor) {

			var demoId             	   = anchor.data('id') || '',
				apiURL                 = anchor.data('demo-api') || '',
				demoType               = anchor.data('demo-type') || '',
				demoURL                = anchor.data('demo-url') || '',
				screenshot             = anchor.data('screenshot') || '',
				demo_name              = anchor.data('demo-name') || '',
				demo_slug              = anchor.data('demo-slug') || '',
				content                = anchor.data('content') || '',
				requiredPlugins        = anchor.data('required-plugins') || '',
				astraSiteOptions       = anchor.find('.astra-site-options').val() || '';
				astraEnabledExtensions = anchor.find('.astra-enabled-extensions').val() || '';

			AstraSitesAdmin._log( astraSitesAdmin.log.preview + ' "' + demo_name + '" URL : ' + demoURL );

			var template = wp.template('astra-site-preview');

			templateData = [{
				id                       : demoId,
				astra_demo_type          : demoType,
				astra_demo_url           : demoURL,
				demo_api                 : apiURL,
				screenshot               : screenshot,
				demo_name                : demo_name,
				slug                     : demo_slug,
				content                  : content,
				required_plugins         : JSON.stringify(requiredPlugins),
				astra_site_options       : astraSiteOptions,
				astra_enabled_extensions : astraEnabledExtensions,
			}];

			// delete any earlier fullscreen preview before we render new one.
			jQuery('.theme-install-overlay').remove();

			jQuery('#astra-sites-menu-page').append(template(templateData[0]));
			jQuery('.theme-install-overlay').css('display', 'block');
			AstraSitesAdmin._checkNextPrevButtons();

			var desc       = jQuery('.theme-details');
			var descHeight = parseInt( desc.outerHeight() );
			var descBtn    = jQuery('.theme-details-read-more');

			if( $.isArray( requiredPlugins ) ) {

				if( descHeight >= 55 ) {

					// Show button.
					descBtn.css( 'display', 'inline-block' );

					// Set height upto 3 line.
					desc.css( 'height', 57 );

					// Button Click.
					descBtn.click(function(event) {

						if( descBtn.hasClass('open') ) {
							desc.animate({ height: 57 },
								300, function() {
								descBtn.removeClass('open');
								descBtn.html( astraSitesAdmin.strings.DescExpand );
							});
						} else {
							desc.animate({ height: descHeight },
								300, function() {
								descBtn.addClass('open');
								descBtn.html( astraSitesAdmin.strings.DescCollapse );
							});
						}

					});
				}

				// or
				var $pluginsFilter    = jQuery( '#plugin-filter' ),
					data 			= {
										action           : 'astra-required-plugins',
										_ajax_nonce      : astraSitesAdmin._ajax_nonce,
										required_plugins : requiredPlugins
									};

				// Add disabled class from import button.
				$('.astra-demo-import')
					.addClass('disabled not-click-able')
					.removeAttr('data-import');

				$('.required-plugins').addClass('loading').html('<span class="spinner is-active"></span>');

			 	// Required Required.
				$.ajax({
					url  : astraSitesAdmin.ajaxurl,
					type : 'POST',
					data : data,
				})
				.fail(function( jqXHR ){

					// Remove loader.
					jQuery('.required-plugins').removeClass('loading').html('');

					AstraSitesAdmin._importFailMessage( jqXHR.status + ' ' + jqXHR.responseText, 'plugins' );
					AstraSitesAdmin._log( jqXHR.status + ' ' + jqXHR.responseText );
				})
				.done(function ( response ) {

					// Release disabled class from import button.
					$('.astra-demo-import')
						.removeClass('disabled not-click-able')
						.attr('data-import', 'disabled');

					// Remove loader.
					$('.required-plugins').removeClass('loading').html('');

					/**
					 * Count remaining plugins.
					 * @type number
					 */
					var remaining_plugins = 0;

					/**
					 * Not Installed
					 *
					 * List of not installed required plugins.
					 */
					if ( typeof response.data.notinstalled !== 'undefined' ) {

						// Add not have installed plugins count.
						remaining_plugins += parseInt( response.data.notinstalled.length );

						jQuery( response.data.notinstalled ).each(function( index, plugin ) {

							var output  = '<div class="plugin-card ';
								output += ' 		plugin-card-'+plugin.slug+'"';
								output += ' 		data-slug="'+plugin.slug+'"';
								output += ' 		data-init="'+plugin.init+'">';
								output += '	<span class="title">'+plugin.name+'</span>';
								output += '	<button class="button install-now"';
								output += '			data-init="' + plugin.init + '"';
								output += '			data-slug="' + plugin.slug + '"';
								output += '			data-name="' + plugin.name + '">';
								output += 	wp.updates.l10n.installNow;
								output += '	</button>';
								// output += '	<span class="dashicons-no dashicons"></span>';
								output += '</div>';

							jQuery('.required-plugins').append(output);

						});
					}

					/**
					 * Inactive
					 *
					 * List of not inactive required plugins.
					 */
					if ( typeof response.data.inactive !== 'undefined' ) {

						// Add inactive plugins count.
						remaining_plugins += parseInt( response.data.inactive.length );

						jQuery( response.data.inactive ).each(function( index, plugin ) {

							var output  = '<div class="plugin-card ';
								output += ' 		plugin-card-'+plugin.slug+'"';
								output += ' 		data-slug="'+plugin.slug+'"';
								output += ' 		data-init="'+plugin.init+'">';
								output += '	<span class="title">'+plugin.name+'</span>';
								output += '	<button class="button activate-now button-primary"';
								output += '		data-init="' + plugin.init + '"';
								output += '		data-slug="' + plugin.slug + '"';
								output += '		data-name="' + plugin.name + '">';
								output += 	wp.updates.l10n.activatePlugin;
								output += '	</button>';
								// output += '	<span class="dashicons-no dashicons"></span>';
								output += '</div>';

							jQuery('.required-plugins').append(output);

						});
					}

					/**
					 * Active
					 *
					 * List of not active required plugins.
					 */
					if ( typeof response.data.active !== 'undefined' ) {

						jQuery( response.data.active ).each(function( index, plugin ) {

							var output  = '<div class="plugin-card ';
								output += ' 		plugin-card-'+plugin.slug+'"';
								output += ' 		data-slug="'+plugin.slug+'"';
								output += ' 		data-init="'+plugin.init+'">';
								output += '	<span class="title">'+plugin.name+'</span>';
								output += '	<button class="button disabled"';
								output += '			data-slug="' + plugin.slug + '"';
								output += '			data-name="' + plugin.name + '">';
								output += astraSitesAdmin.strings.btnActive;
								output += '	</button>';
								// output += '	<span class="dashicons-yes dashicons"></span>';
								output += '</div>';

							jQuery('.required-plugins').append(output);

						});
					}

					/**
					 * Enable Demo Import Button
					 * @type number
					 */
					astraSitesAdmin.requiredPlugins = response.data;
					AstraSitesAdmin._enable_demo_import_button();

				});

			} else {

				// Enable Demo Import Button
				AstraSitesAdmin._enable_demo_import_button( demoType );
				jQuery('.required-plugins-wrap').remove();
			}

			return;
		},

		/**
		 * Enable Demo Import Button.
		 */
		_enable_demo_import_button: function( type ) {

			type = ( undefined !== type ) ? type : 'free';

			switch( type ) {

				case 'free':
							var all_buttons      = parseInt( jQuery( '.plugin-card .button' ).length ) || 0,
								disabled_buttons = parseInt( jQuery( '.plugin-card .button.disabled' ).length ) || 0;

							if( all_buttons === disabled_buttons ) {

								// XML reader not available notice.
								if( astraSitesAdmin.XMLReaderDisabled ) {
									if( ! $('.install-theme-info .astra-sites-xml-notice').length ) {
										$('.install-theme-info').prepend( astraSitesAdmin.strings.warningXMLReader );
									}
									$('.astra-demo-import')
										.removeClass('installing updating-message')
										.addClass('disabled')
										.text( astraSitesAdmin.strings.importDemo );	
								} else {
									$('.astra-demo-import')
										.removeAttr('data-import')
										.removeClass('installing updating-message')
										.addClass('button-primary')
										.text( astraSitesAdmin.strings.importDemo );
								}
							}

					break;

				case 'upgrade':
							var demo_slug = jQuery('.wp-full-overlay-header').attr('data-demo-slug');

							jQuery('.astra-demo-import')
									.addClass('go-pro button-primary')
									.removeClass('astra-demo-import')
									.attr('target', '_blank')
									.attr('href', astraSitesAdmin.getUpgradeURL + demo_slug )
									.text( astraSitesAdmin.getUpgradeText )
									.append('<i class="dashicons dashicons-external"></i>');
					break;

				default:
							var demo_slug = jQuery('.wp-full-overlay-header').attr('data-demo-slug');

							jQuery('.astra-demo-import')
									.addClass('go-pro button-primary')
									.removeClass('astra-demo-import')
									.attr('target', '_blank')
									.attr('href', astraSitesAdmin.getProURL )
									.text( astraSitesAdmin.getProText )
									.append('<i class="dashicons dashicons-external"></i>');
					break;
			}

		},

		/**
		 * Update Page Count.
		 */
		_updatedPagedCount: function() {
			paged = parseInt(jQuery('body').attr('data-astra-demo-paged'));
			jQuery('body').attr('data-astra-demo-paged', paged + 1);
			window.setTimeout(function () {
				jQuery('body').data('scrolling', false);
			}, 800);
		},

		/**
		 * Reset Page Count.
		 */
		_resetPagedCount: function() {

			$('body').addClass('loading-content');
			$('body').attr('data-astra-demo-last-request', '1');
			$('body').attr('data-astra-demo-paged', '1');
			$('body').attr('data-astra-demo-search', '');
			$('body').attr('data-scrolling', false);

		},

		/**
		 * Remove plugin from the queue.
		 */
		_removePluginFromQueue: function( removeItem, pluginsList ) {
			return jQuery.grep(pluginsList, function( value ) {
				return value.slug != removeItem;
			});
		}

	};

	/**
	 * Initialize AstraSitesAdmin
	 */
	$(function(){
		AstraSitesAdmin.init();
	});

})(jQuery);