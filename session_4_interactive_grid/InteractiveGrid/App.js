// Custom Rally App that displays Owners in a grid and filter by Iteration and/or Owner.
//

Ext.define('CustomApp',
{
    extend: 'Rally.app.App',      // The parent class manages the app 'lifecycle' and calls launch() when ready
    componentCls: 'app',          // CSS styles found in app.css

	items:
	[
		{
			xtype: "container",
			itemId: 'pulldown-container',
			layout:
			{
                type: 'hbox',
                align: 'stretch'
            }
		}
	],
	
	// app level references to the store and grid for easy access in various methods
    taskStore: undefined,
    taskGrid: undefined,

    // Entry Point to App
    launch: function()
	{
		this._loadIterations();
    },

    // create iteration pulldown and load iterations
    _loadIterations: function()
	{
		var me = this;
		
        var iterComboBox = Ext.create('Rally.ui.combobox.IterationComboBox',
		{
			itemId: "iteration-combobox",
			fieldLabel: 'Iteration',
			labelAlign: 'right',
			width: 300,
			listeners:
			{
				ready: me._loadOwners,
				select: me._loadData,
				scope: me
			}
        });
		
		me.down('#pulldown-container').add(iterComboBox);
     },
	 
    // create task owner pulldown then load data
    _loadOwners: function()
	{
		var me = this;
        var ownerComboBox = Ext.create('Rally.ui.combobox.FieldValueComboBox',
		{
			itemId: "owner-combobox",
			model: 'Task',
			field: 'Owner',
			fieldLabel: 'Owner',
			labelAlign: 'right',
			listeners:
			{
				ready: me._loadData,
				select: me._loadData,
				scope: me
			}
        });
		
        this.down('#pulldown-container').add(ownerComboBox);
     },

	_getFilters: function(iterationValue, ownerValue)
	{
		var iterationFilter = Ext.create("Rally.data.wsapi.Filter",
		{
			property: 'Iteration',
			operation: '=',
			value: iterationValue
		});
		  
		var ownerFilter = Ext.create("Rally.data.wsapi.Filter",
		{
			property: 'Owner',
			operation: '=',
			value: ownerValue
		});
		return iterationFilter.and(ownerFilter);
	},
	
    // Get data from Rally
    _loadData: function()
	{
		var me = this;
		var selectedIterRef = me.down("#iteration-combobox").getRecord().get('_ref');
		var selectedOwnerValue = me.down("#owner-combobox").getRecord().get('value');
		var myFilters = me._getFilters(selectedIterRef, selectedOwnerValue);
	  
		// if store exists, just load new data
		if (me.taskStore)
		{
			me.taskStore.setFilter(myFilters);
			me.taskStore.load();
		}
		else
		{			
			// create taskStore on the App (via this) so the code above can test for it's existence!
			me.taskStore = Ext.create('Rally.data.wsapi.Store',
			{
				model: 'Task',
				autoLoad: true,
				filters: myFilters,
				listeners:
				{
					load: function(myStore, myData, success)
					{
						// only create a grid if it does NOT already exist
						if (!me.taskGrid)
						{
							me._createGrid(myStore);
						}
					},
					scope: me
				},
				fetch: ['FormattedID', 'Name', 'Owner', 'Iteration']
			});
		}
    },

    // Create and Show a Grid of given task
    _createGrid: function(myTaskStore)
	{
		var me = this;
		me.taskGrid = Ext.create('Rally.ui.grid.Grid',
		{
			store: myTaskStore,
			// Columns to display; must be the same names specified in the fetch: above in the wsapi data store
			columnCfgs: ['FormattedID', 'Name', 'Owner', 'Iteration']
		});

		// add the grid Component to the app-level Container (by doing this.add, it uses the app container)
		me.add(me.taskGrid);
    }
});
