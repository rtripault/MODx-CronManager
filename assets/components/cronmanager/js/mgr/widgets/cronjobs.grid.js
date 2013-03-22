/** * Cron jobs grid * * @class CronManager.grid.CronJobs * @extends MODx.grid.Grid * @param config * @xtype cronmanager-grid-cronjobs */CronManager.grid.CronJobs = function(config) {    config = config || {};    this.exp = new Ext.grid.RowExpander({        tpl : new Ext.Template(            '<p class="desc">{snippet_description}</p>'        )    });    this.actionExp = new Ext.grid.RowExpander({        tpl: '<ul class="actions">' +            '<li><button type="button" class="controlBtn" id="upd-btn-{id}">'+ _('cronmanager.update') +'</button></li>' +            '<li><button type="button" class="controlBtn" id="view-btn-{id}">'+ _('cronmanager.viewlog') +'</button></li>' +            '<li><button type="button" class="controlBtn" id="run-btn-{id}">'+ _('cronmanager.run_now') +'</button></li>' +            '<li><button type="button" class="controlBtn" id="del-btn-{id}">'+ _('cronmanager.remove') +'</button></li>' +        '</ul>'        ,id: 'action-exp'        ,hidden: true    });    Ext.applyIf(config, {        id: 'cronmanager-grid-cronjobs'        ,url: CronManager.config.connectorUrl        ,baseParams: { action: 'mgr/cronjobs/getList' }        ,save_action: 'mgr/cronjobs/updateFromGrid'        ,autosave: true        ,fields: ['id','snippet','snippet_name','properties','minutes','nextrun','lastrun','active','sortorder','snippet_description', 'logs']        ,plugins: [this.actionExp, this.exp]        ,paging: true        ,remoteSort: true        ,anchor: '100%'        ,autoExpandColumn: 'snippet'        ,emptyText: _('cronmanager.norecords')        ,columns: [this.actionExp, this.exp ,{            header: _('id')            ,dataIndex: 'id'            ,sortable: true            ,hidden: true        },{            header: _('cronmanager.snippet')            ,dataIndex: 'snippet_name'            ,sortable: true        },{            header: _('cronmanager.minutes')            ,dataIndex: 'minutes'            ,width: 120            ,fixed: true            ,editor: {                xtype: 'numberfield'                ,minValue: 1                ,description: _('cronmanager.minutes_desc')                ,allowNegative: false            }            ,menuDisabled: true        },{            header: _('cronmanager.lastrun')            ,dataIndex: 'lastrun'            ,fixed: true            ,width: 150            ,menuDisabled: true        },{            header: _('cronmanager.nextrun')            ,dataIndex: 'nextrun'            ,fixed: true            ,width: 150            ,editor: {                xtype: 'xdatetime'                ,dateFormat: MODx.config.manager_date_format                ,timeFormat: MODx.config.manager_time_format            }            ,menuDisabled: true        },{            header: _('cronmanager.logs_entries')            ,dataIndex: 'logs'            ,fixed: true            ,menuDisabled: true        },{            header: _('cronmanager.active')            ,dataIndex: 'active'            ,fixed: true            ,renderer: this.rendYesNo            ,editor: { xtype: 'combo-boolean' }            ,menuDisabled: true        }],        tbar:[{            text: _('cronmanager.create')            ,handler: {                xtype: 'cronmanager-window-create'                ,blankValues: true            }        }]        ,listeners: {            mouseover: function(e, t) {                this.showActions(e, t);            }            ,mouseout: function(e, t) {                this.hideActions(e, t);            }            ,scope: this        }    });    CronManager.grid.CronJobs.superclass.constructor.call(this, config);};Ext.extend(CronManager.grid.CronJobs, MODx.grid.Grid, {    // Build the contextual menu    getMenu: function() {        var m = [{            text: _('cronmanager.update'),            handler: this.updateCronJob        },{            text: _('cronmanager.viewlog'),            handler: this.viewLog        },'-',{            text: _('cronmanager.run_now')            ,handler: this.runNow        },{            text: _('cronmanager.remove'),            handler: this.removeCronJob        }];        this.addContextMenuItem(m);        return true;    }    ,showActions: function(e, t) {        var view = this.getView()            ,row = view.findRowIndex(t);        if (false === row) {            this.getSelectionModel().clearSelections();            return false;        } else if (this.currentRow === row) {            return false;        }        this.getSelectionModel().selectRow(row);        this.hideActions();        this.currentRow = row;        this.actionExp.expandRow(row);        this.trackBtnClick();    }    ,trackBtnClick: function() {        var record = this.getStore().getAt(this.currentRow)            ,upd = Ext.get('upd-btn-' + record.id)            ,vbt = Ext.get('view-btn-' + record.id)            ,run = Ext.get('run-btn-' + record.id)            ,del = Ext.get('del-btn-' + record.id);        this.menu.record = record.data;        if (upd) {            upd.on('click', function(btn, e) {                this.updateCronJob(btn, e);            }, this);        }        if (vbt) {            vbt.on('click', function() {                this.viewLog();            }, this);        }        if (run) {            run.on('click', function() {                this.runNow();            }, this);        }        if (del) {            del.on('click', function() {                this.removeCronJob();            }, this);        }    }    ,hideActions: function(e, t) {        if (this.currentRow === undefined) return false;        var selectedRecord = this.getSelectionModel().getSelected()            ,idx = this.getStore().indexOf(selectedRecord);        if (idx !== this.currentRow || idx === -1 || t !== undefined) {            this.actionExp.collapseRow(this.currentRow);            this.getSelectionModel().clearSelections();            this.currentRow = undefined;        }    }    ,handleAction: function(e) {        var t = e.getTarget();        var elm = t.className.split(' ')[0];        if (elm == 'controlBtn') {            console.log('action!');            return '';            var act = t.className.split(' ')[1];            var record = this.getSelectionModel().getSelected();            this.menu.record = record.data;            switch (act) {                case 'remove':                    this.remove(record, e);                    break;                case 'install':                case 'reinstall':                    this.install(record);                    break;                case 'uninstall':                    this.uninstall(record, e);                    break;                case 'update':                case 'checkupdate':                    this.update(record, e);                    break;                case 'details':                    this.viewPackage(record, e);                    break;                default:                    break;            }        }    }    // Update the selected job    ,updateCronJob: function(btn, e) {        if(!this.updateCronjobWindow) {            this.updateCronjobWindow = MODx.load({                xtype: 'cronmanager-window-update'                ,record: this.menu.record                ,listeners: {                    success: {                        fn: this.refresh                        ,scope: this                    }                }            });        }        this.updateCronjobWindow.setValues(this.menu.record);        this.updateCronjobWindow.show(e.target);    }    // View the logs list    ,viewLog: function() {        location.href = '?a=' + MODx.request.a + '&action=mgr/viewlog&id=' + this.menu.record.id;    }    // Execute the selected job    ,runNow: function() {        MODx.Ajax.request({            url: this.config.url            ,params: {                action: 'mgr/cronjobs/process'                ,id: this.menu.record.id            }            ,listeners: {                success: {                    fn: this.refresh                    ,scope: this                }            }        });    }    // Delete the selected entry    ,removeCronJob: function() {        MODx.msg.confirm({            title: _('cronmanager.remove')            ,text: _('cronmanager.remove_confirm', { snippet: '<b>'+ this.menu.record.snippet_name +'</b>' })            ,url: this.config.url            ,params: {                action: 'mgr/cronjobs/remove'                ,id: this.menu.record.id            }            ,listeners: {                success: {                    fn: this.refresh                    ,scope: this                }            }        });    }});Ext.reg('cronmanager-grid-cronjobs', CronManager.grid.CronJobs);/** * Cron job create window * * @class CronManager.window.Create * @extends MODx.Window * @param config * @xtype cronmanager-window-create */CronManager.window.Create = function(config) {    config = config || {};    Ext.applyIf(config, {        title: _('cronmanager.create')        ,url: CronManager.config.connectorUrl        ,baseParams: {            action: 'mgr/cronjobs/create'        }        ,formDefaults: {            anchor: '100%'            ,allowBlank: false        }        ,fields: [{            xtype: 'hidden'            ,name: 'id'        },{            xtype: 'cronmanager-combo-snippets'            ,fieldLabel: _('cronmanager.snippet')            ,name: 'snippet'        },{            xtype: 'numberfield'            ,fieldLabel: _('cronmanager.minutes')            ,description: _('cronmanager.minutes_desc')            ,name: 'minutes'            ,width: 60            ,value: 60            ,minValue: 1            ,allowNegative: false        },{            xtype: 'textarea'            ,fieldLabel: _('cronmanager.properties')            ,description: _('cronmanager.properties_desc')            ,name: 'properties'            ,allowBlank: true            ,grow: true            ,growMax: 200        }]        ,keys:[{            key: Ext.EventObject.ENTER            ,shift: true            ,fn: this.submit            ,scope: this        }]    });    CronManager.window.Create.superclass.constructor.call(this, config);};Ext.extend(CronManager.window.Create, MODx.Window);Ext.reg('cronmanager-window-create', CronManager.window.Create);/** * Cron job update window * * @class CronManager.window.Update * @extends CronManager.window.Create * @param config * @xtype cronmanager-window-update */CronManager.window.Update = function(config) {    config = config || {};    Ext.applyIf(config, {        title: _('cronmanager.update')        ,baseParams: {            action: 'mgr/cronjobs/update'        }    });    CronManager.window.Update.superclass.constructor.call(this, config);};Ext.extend(CronManager.window.Update, CronManager.window.Create);Ext.reg('cronmanager-window-update', CronManager.window.Update);