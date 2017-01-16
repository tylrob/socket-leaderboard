//Frontend code for node-auth-marionette
$.ajaxSetup({ cache: false }); //prevent jQuery from caching ajax requests and allowing logged out users to see their logged in data.

//Add parse and format functions to Validate.js
validate.extend(validate.validators.datetime, {
	//Input is a Moment so just pass through
	parse: function(value, options){
		return value;
	},
	//Input is a Moment already 
	format: function(value, options){
		var format = options.dateOnly ? 'YYYY-MM-DD' : 'YYYY-MM-DD hh:mm:ss';
		return format(format);
	}
});

//Marionette App
var App = Marionette.Application.extend({
	initialize: function(){
		//Assign a layout to the App, which in turn assigns the Regions upon its creation.
		this.myLayout = new MyLayout().render();
	}
});

//Models
var LoginModel = Backbone.Model.extend({
	urlRoot: '/api/login',
	defaults: {
		"username": null,
		"password": null,
		"isLoggedIn": false
	}
});

var NewUserModel = Backbone.Model.extend({
	urlRoot: '/api/new-user',
	defaults: {
		"username": null,
		"password": null,
		"isLoggedIn": false
	},
	validate: function(attrs){
		var constraints = {
			username: {
				email: true,
				presence: true
			}
		};
		var errors = validate({username: attrs.username}, constraints);
		return errors;
	}
});

var ErrorMessage = Backbone.Model.extend({
	message: null
});

var Weighin = Backbone.Model.extend({
	idAttribute: '_id',
	defaults: {
		"date": null,
		"weight": null
	},
	parse: function(response){
		if (response.date){
			response.date = moment(response.date).utc().startOf('day');			
		}
		return response;
	},
	validate: function(attrs){
		console.log("hello from validate");
		var constraints = {
			date: {
				presence: true,
				datetime: true
			},
			weight: {
				presence: true
			}
		};
		var errors = validate({date: attrs.date, weight: attrs.weight}, constraints);
		return errors;
	}
});

//Collections
var Weighins = Backbone.Collection.extend({
	model: Weighin,
	url: '/api/weighins',
	comparator: 'date'
});

//Regions
var ModalRegion = Mn.Region.extend({
  attachHtml: function(view){
    // Some effect to show the view:
    this.$el.empty().append(view.el);
    this.$el.hide().fadeIn('fast');
  }
});

//Layout View
var MyLayout = Marionette.View.extend({
	el: '#layout-hook',
	template: "#layout",
	regions: {
		navRegion: "#nav-region",
		heroRegion: "#hero-region",
		headerRegion: "#header-region",
		graphRegion: '#graph-region',
		addWeighinFormRegion: '#add-weighin-form-region',
		mainUiRegion: {
			regionClass: ModalRegion,
			el: '#main-ui-region'
		},
		footerRegion: "#footer-region"
	}
});


var NavView = Marionette.View.extend({
	template: "#nav-template"
});

var HeroView = Marionette.View.extend({
	template: "#hero-template"
});

var FooterView = Marionette.View.extend({
	template: "#footer-template"
});

//Error Message View
var ErrorMessageView = Marionette.View.extend({
	template: "#error-message-view"
});

//Views
var LoginFormView = Marionette.View.extend({
	template: "#login-form",
	regions: {
		errorMessage: "#error-message"
	},
	initialize: function(){
	},
	events: {
		'click #login-button': 'submit',
		'keypress': 'submitOnEnter'
	},
	modelEvents: {
		'change':'render'
	},
	submitOnEnter: function(e){
		if (e.which === 13) { // ENTER_KEY is 13
			this.submit();
		}
	},
	submit: function(){
		console.log("clicked save");
		var username = $('input[name="login-username"]').val();
		var password = $('input[name="login-password"]').val();
		this.model.set({
			"username": username,
			"password": password
		});
		var self = this;
		this.model.save(null,{
			success: function(model, response, options){
				console.log("Save successful");
				console.log("Message from backend: " + JSON.stringify(options))
				console.log(JSON.stringify(response))
				self.model.set({
					"password": null
				});
				app.router.navigate('weighins',{trigger: true});
			},
			error: function(model, response, options){
				self.model.set({
					"password": null
				});
				var message = new ErrorMessage({message: response.responseJSON.error});
				var messageView = new ErrorMessageView({model: message});
				self.showChildView('errorMessage', messageView);
				console.log("save error");
				console.log("Message from backend: " + response.responseJSON.error)
			}
		});
	}
});

var NewUserFormView = Marionette.View.extend({
	template: "#new-user-form",
	regions: {
		errorMessage: "#error-message"
	},
	initialize: function(){
	},
	events: {
		'click #new-user-button': 'save',
	},
	onRender: function(){

	},
	save: function(){
		var username = $('input[name="new-user-username"]').val();
		var password = $('input[name="new-user-password"]').val();
		this.model.set({
			"username": username,
			"password": password
		});
		this.model.save(null,{
			success: function(model, response, options){
				console.log("Save successful");
				console.log("Message from backend: " + JSON.stringify(options))
				console.log(JSON.stringify(response))
				app.router.navigate('weighins',{trigger: true});
			},
			error: function(){
				console.log("save error");
			}
		});
		if (this.model.validationError){
			this.showError(this.model.validationError);
		}		
	},
	showError: function(error){
		error = JSON.stringify(error);
		var messageModel = new ErrorMessage({message: error});
		var messageView = new ErrorMessageView({model: messageModel});
		this.showChildView('errorMessage', messageView);
	}
});

var AddWeighinFormView = Marionette.View.extend({
	template: '#add-weighin-form-view',
	regions: {
		errorMessage: "#error-message"
	},
	events: {
		'click #save': 'save',
		'keypress': 'submitOnEnter',
		'change #weightDate': 'updateViewForDuplicateDate',
		'invalid': 'invalidEventFired'
	},
	initialize: function(){
		this.listenTo()
	},
	invalidEventFired: function(){
		console.log('invalid event fired');
	},
	submitOnEnter: function(e){
		if (e.which === 13) { // ENTER_KEY is 13
			e.preventDefault();
			this.save();
		}
	},
	save: function(){
		var self = this;
		var weight = $('#weight').val();
		var date = $('#weightDate').val();
		date = moment(date).utc().startOf('day');	
		if (this.hasDuplicateDate()){
			console.log("hasduplicate date is true");
			//Find the existing model that matches in the client collection
			var existingWeighin = app.weighins.find(function(weighin){
				return moment(date).isSame(weighin.get('date'));
			});
			//Set it on the client
			existingWeighin.save({
				'weight': weight,
				'date': date
			},{
				wait: true,
				success: function(){
					$('#weight').val('');
					$('#weightDate').val('');
					self.clearMessages();
					console.log("success");
				},
				error: function(){
					console.log("error");
				}
			});
			//TODO: Make this show on UI not console
			console.log(JSON.stringify(existingWeighin.validationError));
			/*
			if (existingWeighin.validationError !== undefined){
				this.showErrorMessage(JSON.stringify(existingWeighin.validationError));				
			} else {
				this.clearMessages();
			}
			*/
		} else {
			//Add new...
			var newWeighin = new Weighin();
			newWeighin.set({
				"weight": weight,
				"date": date
			});
			//collection.create() calls validate on its own. If the model doesn't validate, won't add or call server.
			app.weighins.create(newWeighin,{
				wait: true,
				success: function(){
					$('#weight').val('');
					$('#weightDate').val('');
					self.clearMessages();
					console.log("Success");
				},
				error: function(){
					console.log("error");
				}
			});
			//TODO: Make this show on UI not console. Move it to the error callback of create.
			console.log(JSON.stringify(newWeighin.validationError));
			/*
			if (newWeighin.validationError !== undefined){
				this.showErrorMessage(JSON.stringify(newWeighin.validationError));				
			} else {
				this.clearMessages();
			}
			*/
		}
	},
	hasDuplicateDate: function(){
		var date = $('#weightDate').val();
		date = moment(date).utc().startOf('day');
		var existingDates = app.weighins.pluck('date');
		console.log(existingDates);
		//See if you can find the existing date in the collection
		var findResult = _.find(existingDates, function(existingDate){
			return moment(date).isSame(existingDate);
		});
		if (findResult !== undefined){
			return true;
		} else {
			return false;
		}
	},
	updateViewForDuplicateDate: function(){
		if (this.hasDuplicateDate()){
			this.showErrorMessage('You already have an entry for that date.');
			$('#save').text('Save anyway');			
		} else {
			this.clearMessages();
		}
	},
	clearMessages: function(){
		this.getRegion('errorMessage').empty();
		$('#save').text('Save');
	},
	showErrorMessage: function(errorText){
		var message = new ErrorMessage({message: errorText});
		var messageView = new ErrorMessageView({model: message});
		this.getRegion('errorMessage').show(messageView);
	}
});

//These three views create a Table in Marionette 3
var RowView = Marionette.View.extend({
	tagName: 'tr',
	template: '#row-template',
	triggers: {
		'click .edit-weighin': 'editWeighin',
		'click .delete-weighin': 'deleteWeighin'
	},

});

var TableBody = Marionette.CollectionView.extend({
	tagName: 'tbody',
	initialize: function(){
		this.listenTo(this.collection, 'sync', function(){
			console.log("tablebody Heard a sync");
			this.render();
		});
	},
	childView: RowView,
	childViewEvents: {
		'editWeighin': 'editWeighin',
		'deleteWeighin': 'deleteWeighin'
	},
	editWeighin: function(){
		console.log("Edit link clicked");
	},
	deleteWeighin: function(event){
		event.model.destroy({wait:true});
	}	
});

var TableView = Marionette.View.extend({
	tagName: 'table',
	className: 'table table-hover',
	template: '#table-template',
	regions: {
		body: {
			el: 'tbody',
			replaceElement: true
		}
	},
	onRender: function(){
		this.showChildView('body', new TableBody({
			collection: this.collection
		}));
	}
});

var GraphView = Marionette.View.extend({
	template: '#graph-template',
	onAttach: function(){
		this.drawGraph();
		this.listenTo(this.collection, 'sync', function(){
			console.log("Heard a sync");
			this.updateGraph();
		});
		this.listenTo(this.collection, 'update', function(){
			console.log("Heard update");
			this.updateGraph();
		})
	},
	drawGraph: function(){
		//This view is acting like a controller for the Chartist functionality.
		//Need to iterate through the collection to generate the data to pass to Chartist
		var graphData = {
			series: [
				{
					name: 'weigh-series',
					data: []					
				}
			]
		};

		this.collection.each(function(model){
			graphData.series[0].data.push({
				x: model.get('date'),
				y: model.get('weight')
			});
		});

		console.log(JSON.stringify(graphData));

		console.log("draw graph");
		new Chartist.Line($('#graph').get(0), graphData, {
			axisX: {
				type: Chartist.FixedScaleAxis,
				divisor: 5,
				labelInterpolationFnc: function(value) {
					return moment(value).format('MMM D');
				}
			}
		});
	},
	updateGraph: function(){
		var updateData = {
			series: [
				{
					name: 'weigh-series',
					data: []					
				}
			]
		};

		this.collection.each(function(model){
			updateData.series[0].data.push({
				x: model.get('date'),
				y: model.get('weight')
			});
		});

		console.log(JSON.stringify(updateData));
		var mychart = $('#graph');
		mychart.get(0).__chartist__.update(updateData);
	}
});

//Controller
var MyController = {
	clearRegions: function(){
		app.myLayout.getRegion('footerRegion').empty();
		app.myLayout.getRegion('graphRegion').empty();
		app.myLayout.getRegion('addWeighinFormRegion').empty();
		app.myLayout.getRegion('navRegion').empty();
	},
	showNewUserForm: function(){
		this.clearRegions();
		app.heroView = new HeroView();
		app.newUserFormView = new NewUserFormView({model: app.newUserModel});
		app.myLayout.showChildView('heroRegion', app.heroView);		
		app.myLayout.getRegion('mainUiRegion').show(app.newUserFormView);
	},
	showLoginForm: function(){
		this.clearRegions();
		app.heroView = new HeroView();
		app.loginFormView = new LoginFormView({model: app.loginModel});
		app.myLayout.showChildView('heroRegion', app.heroView);
		app.myLayout.getRegion('mainUiRegion').show(app.loginFormView);
	},
	showWeighins: function(){
		console.log('showing weighins');
		app.myLayout.getRegion('heroRegion').empty();
		app.myLayout.getRegion('navRegion').show(new NavView());
		app.myLayout.getRegion('footerRegion').show(new FooterView());
		app.weighins = new Weighins();
		app.weighins.fetch({
			success: function(model, response, options){
				app.tableView = new TableView({collection: app.weighins});
				app.myLayout.showChildView('mainUiRegion', app.tableView);
				app.graphView = new GraphView({collection: app.weighins});
				app.myLayout.showChildView('graphRegion', app.graphView);
			},
			error: function(model, response, options){
				console.log(response);
			}
		});
		app.addWeighinFormView = new AddWeighinFormView();
		app.myLayout.showChildView('addWeighinFormRegion', app.addWeighinFormView);	
	}
};

var Router = Marionette.AppRouter.extend({
	controller: MyController,
	appRoutes: {
		'':'showLoginForm',
		'login':'showLoginForm',		
		'newuser':'showNewUserForm',
		'weighins':'showWeighins'
	}
});

//Start App
var app = new App();
app.loginModel = new LoginModel(bootstrappedLogin);
app.newUserModel = new NewUserModel();
app.router = new Router();
Backbone.history.start();