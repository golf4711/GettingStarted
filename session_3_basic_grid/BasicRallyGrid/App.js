// Custom Rally App that displays Stories in a grid.
//
// Note: various console debugging messages intentionally kept in the code for learning purposes

Ext.define('CustomApp', {
    extend: 'Rally.app.App',      // The parent class manages the app 'lifecycle' and calls launch() when ready
    componentCls: 'app',          // CSS styles found in app.css

    // Entry Point to App
    launch: function() {
		this.pulldownContainer = Ext.create("Ext.container.Container", {
			layout: {
				type: "hbox",
				aligh: "stretch"
			},
		});
		this.add(this.pulldownContainer);
		this._loadIterations();
    },
	
	_loadIterations: function() {
		this.iterComboBox = Ext.create("Rally.ui.combobox.IterationComboBox", {
			fieldLabel: "Iteration",
			labelAlign: "right",
			width: 300,
			listeners: {
				ready: function(combobox) {
					this._loadOwners();
				},
				select: function(combobox, records) {
					this._loadData();	
				},
				scope: this
			}
		});
		
		this.pulldownContainer.add(this.iterComboBox);
	},
	
	_loadOwners: function() {
		this.ownerComboBox = Ext.create("Rally.ui.combobox.FieldValueComboBox", {
			fieldLabel: "Owner",
			labelAlign: "right",
			model: "Task",
			field: "Owner",
			width: 300,
			listeners: {
				ready: function(combobox) {
					this._loadData();
				},
				select: function(combobox, records) {
					this._loadData();	
				},
				scope: this
			}
		});
		
		this.pulldownContainer.add(this.ownerComboBox);
	},

    // Get data from Rally
    _loadData: function() {
		var selectedIterRef = this.iterComboBox.getRecord().get("_ref");
		var selectedOwner = this.ownerComboBox.getRecord().get("value");
		
		var myFilters =
		[
			{
				property: "Iteration",
				operation: "=",
				value: selectedIterRef
			},
			{
				property: "Owner",
				operation: "=",
				value: selectedOwner
			}
		];
			
		// if store exists, just load new data
		if (this.taskStore) {
			this.taskStore.setFilter(myFilters);
			this.taskStore.load();
		// Create Store
		} else {
			this.taskStore = Ext.create('Rally.data.wsapi.Store', {
				model: 'Task',
				autoLoad: true,                         // <----- Don't forget to set this to true! heh
				filters: myFilters,
				listeners: {
					load: function(myStore, myData, success) {
						if(!this.myGrid) {
							this._createGrid(myStore);      // if we did NOT pass scope:this below, this line would be incorrectly trying to call _createGrid() on the store which does not exist.
						}
					},
					scope: this                         // This tells the wsapi data store to forward pass along the app-level context into ALL listener functions
				},
				fetch: ['FormattedID', 'Name', "Owner", "Iteration"]   // Look in the WSAPI docs online to see all fields available!
			});
		}

    },

    // Create and Show a Grid of given stories
    _createGrid: function(myStoryStore) {

      this.myGrid = Ext.create('Rally.ui.grid.Grid', {
        store: myStoryStore,
        columnCfgs: [         // Columns to display; must be the same names specified in the fetch: above in the wsapi data store
          'FormattedID', 'Name', "Owner", "Iteration"
        ]
      });

      this.add(this.myGrid);       // add the grid Component to the app-level Container (by doing this.add, it uses the app container)
    }

});
