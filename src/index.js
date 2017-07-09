import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import JSONPretty from 'react-json-pretty';
import './index.css';

var JSONBox = React.createClass({
	getInitialState: function () {
		var data = [];
		var savedJson = localStorage.getItem("savedJson");
		if(savedJson)
			data = JSON.parse(savedJson);
		return {
			data: data
		};
	},
	addValue: false,
	property: null,
	propertyType: null,
	valueInputs: [],
	generateId: function () {
		return Math.floor(Math.random()*90000) + 10000;
	},
	getJsonObject: function() {
		var json = {};
		this.state.data.map(function (jsonProperty) {
			json[jsonProperty.propertyKey] = jsonProperty.propertyValue;
		});
		return json;
	},
	handleNodeEdit: function (nodeId) {
		var data = this.state.data;
		data = data.filter(function (el) {
			return el.id === nodeId;
		});
		this.property = data[0];
		this.propertyType = this.property.propertyType;
		this.valueInputs = [];
		this.addValue = false;
		this.forceUpdate();
	},
	handleItemRemoval: function (nodeId) {
		var data = this.state.data;
		data = data.filter(function (el) {
			return el.id !== nodeId;
		});
		this.setState({data});
		localStorage.setItem("savedJson", JSON.stringify(data));
		return;
	},
	handleSubmit: function (propertyKey, propertyType, propertyValue) {
		var data = this.state.data;
		var id;
		if(this.property) {
			id = this.property.id;
			for (var key in data) {
				if(data[key].id==id) {
					data[key].propertyKey = propertyKey;
					data[key].propertyType = propertyType;
					data[key].propertyValue = propertyValue;
				}
			}
		}
		else {
			id = this.generateId().toString();
			data = data.concat([{id, propertyKey, propertyType, propertyValue}]);
		}

		this.addValue = false;
		this.property = null;
		this.propertyType = null;
		this.valueInputs = [];
		this.setState({data});
		localStorage.setItem("savedJson", JSON.stringify(data));
	},
	handleCancel: function () {
		this.addValue = false;
		this.property = null;
		this.propertyType = null;
		this.valueInputs = [];
		this.forceUpdate();
	},
	handleTypeChanged: function (propertyType) {
		this.propertyType = propertyType;
		this.valueInputs = [];
		this.addValue = false;
		this.forceUpdate();
	},
	handleAddValueInput: function () {
		this.addValue = true;
		this.forceUpdate();
	},
	render: function() {
		return (
			<div>
				<div className="well col-lg-6">
					<h1 className="vert-offset-top-0">JSON:</h1>
					<JsonPropertyList data={this.state.data} editNode={this.handleNodeEdit} removeNode={this.handleItemRemoval} toggleComplete={this.handleToggleComplete} />
					<JsonForm onJsonSubmit={this.handleSubmit} onCancel={this.handleCancel} onAddValueInput={this.handleAddValueInput} onTypeChanged={this.handleTypeChanged} propertyType={this.propertyType} property={this.property} valueInputs={this.valueInputs} addValue={this.addValue} />
				</div>
				<JSONPretty id="json-pretty" json={this.getJsonObject()}></JSONPretty>
			</div>
		);
	}
});

var JsonPropertyList = React.createClass({
	removeNode: function (nodeId) {
		this.props.removeNode(nodeId);
		return;
	},
	editNode: function (nodeId) {
		this.props.editNode(nodeId);
		return;
	},
	render: function() {
		var listNodes = this.props.data.map(function (jsonProperty) {
			return (
				<JsonProperty key={jsonProperty.id} nodeId={jsonProperty.id} propertyKey={jsonProperty.propertyKey} propertyType={jsonProperty.propertyType} propertyValue={jsonProperty.propertyValue} editNode={this.editNode} removeNode={this.removeNode} />
			);
		},this);
		return (
			<ul className="list-group">
				{listNodes}
			</ul>
		);
	}
});

var JsonProperty = React.createClass({
	removeNode: function (e) {
		e.preventDefault();
		this.props.removeNode(this.props.nodeId);
		return;
	},
	editNode: function (e) {
		e.preventDefault();
		this.props.editNode(this.props.nodeId);
		return;
	},
	render: function() {
		return (
			<li className="list-group-item clearfix">
				{this.props.propertyKey}
				<span className="label label-info">{this.props.propertyType}</span>
				<div className="pull-right" role="group">
					<button type="button" className="btn btn-xs btn-default glyphicon glyphicon-pencil" onClick={this.editNode}></button>{" "}
					<button type="button" className="btn btn-xs btn-default glyphicon glyphicon-remove" onClick={this.removeNode}></button>
				</div>
			</li>
		);
	}
});

var JsonForm = React.createClass({
	doSubmit: function (e) {
		e.preventDefault();
		var propertyKey = ReactDOM.findDOMNode(this.refs.propertyKey).value.trim();
		var propertyType = ReactDOM.findDOMNode(this.refs.propertyType).value.trim();
		var propertyValue;
		
		if(this.props.propertyType === 'object') {
			propertyValue = {};
			for(var i=1; i<=this.props.valueInputs.length; i++) {
				var key = ReactDOM.findDOMNode(this.refs['propertyValue'+i]).value.trim();
				var val = ReactDOM.findDOMNode(this.refs['propertyValue'+i+i]).value.trim();
				if(key !== '')
					propertyValue[key] = val;
			}
		}
		else if(this.props.propertyType === 'array') {
			propertyValue = [];
			for(var j=1; j<=this.props.valueInputs.length; j++) {
				propertyValue.push(ReactDOM.findDOMNode(this.refs['propertyValue'+j]).value.trim());
			}
		}
		else if(ReactDOM.findDOMNode(this.refs.propertyValue1) != null) {
			propertyValue = ReactDOM.findDOMNode(this.refs.propertyValue1).value.trim();
			propertyValue = this.getValideValue(propertyValue);
		}

		if (!propertyKey || !propertyType || (!propertyValue && typeof(propertyValue)!=='boolean')) {
			return;
		}

		this.props.onJsonSubmit(propertyKey, propertyType, propertyValue);
		ReactDOM.findDOMNode(this.refs.propertyKey).value = '';
		ReactDOM.findDOMNode(this.refs.propertyType).value = '';
		
		return;
	},
	cancel: function(e) {
		e.preventDefault();
		this.props.onCancel();
	},
	typeChanged: function () {
		var propertyType = ReactDOM.findDOMNode(this.refs.propertyType).value.trim();
		this.props.onTypeChanged(propertyType);
		return;
	},
	addValueInput: function () {
		this.props.onAddValueInput();
		return;
	},
	getValideValue: function (value) {
		var valide = false;
		switch(this.props.propertyType) {
			case 'text':
				valide = true;
				break;
			case 'boolean':
				var boolVal = value.toLowerCase();
				if(boolVal==='true' || boolVal==='false') {
					valide = true;
					value = $.parseJSON(boolVal);
				}
				break;
			case 'number':
				var number = Number(value);
				if(!isNaN(number)) {
					valide = true;
					value = number;
				}
				break;
		}
		return valide ? value : null;
	},
	simpleValueInput: function (isArray = false) {
		var id = "propertyValue" + (this.props.valueInputs.length+1);
		var label = 'Value';
		var iniTialVal = '';
		if(isArray)
			label += ' ' + (this.props.valueInputs.length+1);
		
		if(!this.props.addValue) {
			if(this.props.property) {
				if(isArray) {
					if(this.props.property.propertyValue[this.props.valueInputs.length])
							iniTialVal = <div className="alert alert-info" role="alert">{this.props.property.propertyValue[this.props.valueInputs.length].toString()}</div>
				}
				else
					iniTialVal = <div className="alert alert-info" role="alert">{this.props.property.propertyValue.toString()}</div>
			}
		}

		return (
			<div key={this.props.valueInputs.length+1} className="form-group">
				<label htmlFor={id} className="col-md-2 control-label">{label}</label>
				<div className="col-md-10">
					{iniTialVal}
					<input type="text" id={id} ref={id} className="form-control" placeholder="Your property value" />
				</div>
			</div>
		)
	},
	keyValueInput: function (key='', val='') {
		var keyId = "propertyValue" + (this.props.valueInputs.length+1);
		var valueId = keyId + (this.props.valueInputs.length+1);
		var iniTialKey = '';
		var iniTialVal = '';
		
		if(!this.props.addValue) {
			if(this.props.property && key) {
				iniTialKey = <div className="alert alert-info" role="alert">{key}</div>
				iniTialVal = <div className="alert alert-info" role="alert">{val}</div>
			}
		}
		
		return (
			<div key={this.props.valueInputs.length+1} className="form-group">
				<label htmlFor={keyId} className="col-md-2 col-xs-12 control-label">Value {this.props.valueInputs.length+1}</label>
				<div className="col-md-5 col-xs-6">
					{iniTialKey}
					<input type="text" id={keyId} ref={keyId} className="form-control" placeholder="Key" />
				</div>
				<div className="col-md-5 col-xs-6">
					{iniTialVal}
					<input type="text" id={valueId} ref={valueId} className="form-control" placeholder="Value" />
				</div>
			</div>
		)
	},
	render: function() {
		var iniTialKey = '';
		var iniTialType = '';
		var cancelButton = '';
		if(this.props.property !== null) {
			iniTialKey = <div className="alert alert-info" role="alert">{this.props.property.propertyKey}</div>
			iniTialType = <div className="alert alert-info" role="alert">{this.props.property.propertyType}</div>
			cancelButton = <input type="reset" id="btn-cancel" value="Cancel" className="btn btn-default" onClick={this.cancel} />
		}
		
		var btnAddContainerClass = "form-group hidden";
		if(this.props.propertyType === 'object') {
			if(!this.props.addValue && this.props.property) {
				var keys = Object.keys(this.props.property.propertyValue);
				var values = Object.values(this.props.property.propertyValue);
				for (var k=0; k<keys.length; k++) {
					this.props.valueInputs.push(this.keyValueInput(keys[k], values[k]));
				}
			}
			else
				this.props.valueInputs.push(this.keyValueInput());
			btnAddContainerClass = btnAddContainerClass.replace(' hidden', '');
		}
		else if(this.props.propertyType === 'array') {
			if(!this.props.addValue && this.props.property) {
				for (var k=0; k<this.props.property.propertyValue.length; k++) {
					this.props.valueInputs.push(this.simpleValueInput(true));
				}
			}
			else
				this.props.valueInputs.push(this.simpleValueInput(true));
			btnAddContainerClass = btnAddContainerClass.replace(' hidden', '');
		}
		else if(this.props.propertyType!=null) {
			this.props.valueInputs.push(this.simpleValueInput());
		}
		
		return (
			<div className="commentForm vert-offset-top-2">
				<hr />
				<div className="clearfix">
					<form className="jsonForm form-horizontal" onSubmit={this.doSubmit}>
						<div className="form-group">
							<label htmlFor="propertyKey" className="col-md-2 control-label">Key</label>
							<div className="col-md-10">
								{iniTialKey}
								<input type="text" id="propertyKey" ref="propertyKey" className="form-control" placeholder="Your property name" />
							</div>
						</div>
						
						<div className="form-group">
							<label htmlFor="propertyType" className="col-md-2 control-label">Type</label>
							<div className="col-md-10">
								{iniTialType}
								<select id="propertyType" ref="propertyType" className="form-control" onChange={this.typeChanged}>
									<option value="">Your property type</option>
									<option>text</option>
									<option>boolean</option>
									<option>number</option>
									<option>array</option>
									<option>object</option>
								</select>
							</div>
						</div>
						
						{this.props.valueInputs}
						
						<div id="btn-add-container" className={btnAddContainerClass}>
							<div className="col-md-12 text-center">
								<input type="button" value="Add value" className="btn btn-default btn-block" onClick={this.addValueInput} />
							</div>
						</div>
						
						<div className="row">
							<div className="col-md-10 col-md-offset-2 text-right">
								{cancelButton}
								<input type="submit" value={this.props.property ? "Edit Item" : "Save Item"} className="btn btn-primary" />
							</div>
						</div>
					</form>
				</div>
			</div>
		);
	}
});

ReactDOM.render(<JSONBox />, document.getElementById('jsonBox'));
$("#json-pretty").addClass('col-lg-5 col-lg-push-1');