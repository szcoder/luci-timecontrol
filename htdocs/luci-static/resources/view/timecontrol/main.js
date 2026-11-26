'use strict';
'require view';
'require uci';
'require rpc';
'require dom';
'require ui';

/* OpenWrt 25.12 / LuCI JavaScript view, no Lua or luci-compat required. */

var callGetDevices = rpc.declare({
	object: 'luci.timecontrol',
	method: 'get_devices',
	expect: { devices: [] },
	reject: true
});

var callReload = rpc.declare({
	object: 'luci.timecontrol',
	method: 'reload'
});

var callUciCommit = rpc.declare({
	object: 'uci',
	method: 'commit',
	params: [ 'config' ],
	reject: true
});

var WEEKDAYS = [
	[ 'Mon', '周一' ], [ 'Tue', '周二' ], [ 'Wed', '周三' ],
	[ 'Thu', '周四' ], [ 'Fri', '周五' ], [ 'Sat', '周六' ],
	[ 'Sun', '周日' ]
];

var VENDORS = {
	'7811DC': 'Sony', '103D0A': 'TCL/Roku', 'F49D8A': 'Anker',
	'001018': 'Broadcom', '0019D2': 'Huawei', '00E04C': 'Realtek',
	'0050F2': 'Microsoft', '001B21': 'Intel', '00C0CA': 'Intel',
	'001DD8': 'Microsoft', '984FEE': 'Apple', 'F0B479': 'Apple',
	'ACBC32': 'Apple', '94BF2D': 'Apple', '3CE072': 'Apple',
	'685B35': 'Apple', 'A8BE27': 'Apple', '50ED3C': 'Apple',
	'DC2C26': 'Apple', '88E9FE': 'Apple', '849866': 'Samsung',
	'A0CC2B': 'Samsung', '3065EC': 'Samsung', '54880E': 'Samsung',
	'B47C9C': 'Amazon', '747548': 'Amazon', '0C47C9': 'Amazon',
	'F0272D': 'Amazon', '74C63B': 'Amazon', '84D6D0': 'Amazon',
	'44650D': 'Amazon', '08ED02': 'Amazon', 'AC63BE': 'Amazon',
	'50F5DA': 'Amazon', '00FC8B': 'Amazon', '88C9D0': 'Xiaomi',
	'286C07': 'Xiaomi', 'F0B429': 'Xiaomi', '9C99A0': 'Xiaomi',
	'185936': 'Xiaomi', '98FAE3': 'Xiaomi', '640980': 'Xiaomi',
	'8C882B': 'Xiaomi', '00EC0A': 'Xiaomi', '70BB3E': 'Xiaomi',
	'50EC50': 'Xiaomi', '8CEBE6': 'Xiaomi', '9CEFD5': 'Oppo',
	'1C687E': 'Oppo', '8C6D50': 'Oppo', 'E8BBA8': 'Oppo',
	'ACCB51': 'Oppo/OnePlus', '886AB1': 'vivo', 'C46516': 'vivo',
	'00A0C9': 'Intel', 'D4E8B2': 'Tuya', 'D4A651': 'Tuya',
	'7CF666': 'Tuya', '508A06': 'Tuya', 'D8F15B': 'Tuya',
	'68572D': 'Tuya', '1869D8': 'Tuya', '246F28': 'ESP32',
	'2462AB': 'ESP8266', '2CF432': 'ESP8266', '5CCF7F': 'ESP8266',
	'18FE34': 'ESP8266', '60019F': 'ESP8266', 'A020A6': 'ESP8266',
	'AC2B6E': 'Intel NUC', '4CCC6A': 'Intel NUC', 'F8633F': 'Intel NUC'
};

function vendorOf(mac) {
	if (!mac)
		return '';

	return VENDORS[String(mac).replace(/:/g, '').toUpperCase().substring(0, 6)] || '';
}

function commitChanges() {
	// uci.apply() enables rollback + deferred confirm; reloading the page
	// immediately would cancel confirm and roll everything back. Use a plain
	// uci commit instead, then reload the timecontrol service explicitly.
	return uci.save()
		.then(function() { return callUciCommit('timecontrol'); })
		.then(function() { return callReload(); });
}

function reportError(err) {
	var msg = (err && err.message) ? err.message : String(err || '未知错误');
	alert('操作失败: ' + msg);
}

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('timecontrol'),
			callGetDevices()
		]);
	},

	render: function(data) {
		// expect: { devices: [] } makes rpc.declare return the array itself
		var devices = Array.isArray(data[1]) ? data[1] : [];
		var devicesByName = {};
		var slots = uci.sections('timecontrol', 'timeslot');

		uci.sections('timecontrol', 'device').forEach(function(section) {
			devicesByName[section['.name']] = section;
		});

		var style = E('style', {}, [
			'.timecontrol-table { width: 100%; border-collapse: collapse; margin: 20px 0; }',
			'.timecontrol-table th, .timecontrol-table td { padding: 10px; text-align: left; border: 1px solid #ddd; }',
			'.timecontrol-table th { background: #f0f0f0; }',
			'.timecontrol-form { background: #f9f9f9; padding: 15px; margin: 10px 0; border: 1px solid #ddd; }',
			'.timecontrol-row { margin: 10px 0; }',
			'.timecontrol-row label { display: inline-block; width: 100px; }',
			'.timecontrol-btn { padding: 5px 12px; margin: 2px; border: 1px solid #007bff; border-radius: 4px; background: #007bff; color: #fff; cursor: pointer; }',
			'.timecontrol-btn:hover { background: #0056b3; }',
			'.timecontrol-add { background: #4CAF50; border-color: #4CAF50; padding: 8px 16px; }',
			'.timecontrol-delete { background: #f44336; border-color: #f44336; padding: 5px 10px; }',
			'.timecontrol-edit { background: #2196F3; border-color: #2196F3; padding: 5px 10px; }',
			'.timecontrol-disable { background: #ff9800; border-color: #ff9800; padding: 5px 10px; }',
			'.timecontrol-enable { background: #4CAF50; border-color: #4CAF50; padding: 5px 10px; }',
			'.weekday-container { display: flex; flex-wrap: wrap; gap: 8px; margin: 15px 0; justify-content: center; }',
			'.weekday-container label { display: flex; align-items: center; background: #f8f9fa; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; cursor: pointer; min-width: 60px; justify-content: center; }',
			'.weekday-container input { margin-right: 6px; }',
			'@media (max-width: 768px) {',
			'  .weekday-container { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 0 5px; }',
			'  .weekday-container label { padding: 12px 16px; border-width: 2px; font-size: 16px; min-height: 48px; }',
			'  .weekday-container input { transform: scale(1.2); }',
			'}'
		].join('\n'));

		var select = E('select', { id: 'new_device', style: 'width: 300px' }, [
			E('option', { value: '' }, '-- 请选择设备 --')
		]);

		devices.slice().sort(function(a, b) {
			return String(a.name || '').localeCompare(String(b.name || ''));
		}).forEach(function(device) {
			var vendor = vendorOf(device.mac);
			var display = device.name || vendor || '未知设备';

			if (vendor && display.indexOf(vendor) === -1)
				display = display + ' [' + vendor + ']';

			select.appendChild(E('option', {
				value: display + ' (' + device.mac + ')'
			}, display + ' - ' + (device.ip || '') + ' (' + device.mac + ')'));
		});

		var weekdayBoxes = {};
		var weekdayRow = E('div', { 'class': 'weekday-container' });

		WEEKDAYS.forEach(function(day) {
			var checkbox = E('input', { type: 'checkbox', id: 'weekday_' + day[0] });
			weekdayBoxes[day[0]] = checkbox;
			weekdayRow.appendChild(E('label', {}, [ checkbox, E('span', {}, day[1]) ]));
		});

		function selectDays(days) {
			WEEKDAYS.forEach(function(day) {
				weekdayBoxes[day[0]].checked = days.indexOf(day[0]) !== -1;
			});
		}

		var shortcutRow = E('div', {}, [
			E('button', { type: 'button', 'class': 'timecontrol-btn' }, '全选'),
			E('button', { type: 'button', 'class': 'timecontrol-btn' }, '全不选'),
			E('button', { type: 'button', 'class': 'timecontrol-btn' }, '工作日'),
			E('button', { type: 'button', 'class': 'timecontrol-btn' }, '周末')
		]);

		shortcutRow.children[0].addEventListener('click', function() {
			selectDays(WEEKDAYS.map(function(d) { return d[0]; }));
		});
		shortcutRow.children[1].addEventListener('click', function() { selectDays([]); });
		shortcutRow.children[2].addEventListener('click', function() {
			selectDays([ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri' ]);
		});
		shortcutRow.children[3].addEventListener('click', function() { selectDays([ 'Sat', 'Sun' ]); });

		var manualNameInput = E('input', { type: 'text', id: 'manual_name', placeholder: '例如：客厅电视' });
		var manualMacInput = E('input', { type: 'text', id: 'manual_mac', placeholder: 'XX:XX:XX:XX:XX:XX' });
		var startTime = E('input', { type: 'time', id: 'start_time' });
		var stopTime = E('input', { type: 'time', id: 'stop_time' });
		var submitButton = E('button', {
			type: 'button',
			'class': 'timecontrol-btn timecontrol-add'
		}, '提交');

		submitButton.addEventListener('click', function() {
			var manualMac = manualMacInput.value.trim();
			var manualName = manualNameInput.value.trim();
			var name, mac;

			if (manualMac) {
				if (!/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(manualMac)) {
					alert('MAC 地址格式不正确，应为 XX:XX:XX:XX:XX:XX');
					return;
				}
				mac = manualMac.toUpperCase();
				name = manualName || '手动设备';
			}
			else {
				var match = select.value.match(/^(.*) \(([0-9A-Fa-f:]{17})\)$/);
				if (!match) {
					alert('请选择设备，或在下方手动输入设备名称和 MAC 地址');
					return;
				}
				name = match[1];
				mac = match[2];
			}

			var weekdays = WEEKDAYS.filter(function(d) {
				return weekdayBoxes[d[0]].checked;
			}).map(function(d) { return d[0]; });

			if (weekdays.length === 0 || !startTime.value || !stopTime.value) {
				alert('请填写完整信息');
				return;
			}

			var deviceId = 'device_' + mac.toLowerCase().replace(/:/g, '');

			if (!uci.get('timecontrol', deviceId)) {
				uci.add('timecontrol', 'device', deviceId);
				uci.set('timecontrol', deviceId, 'name', name);
				uci.set('timecontrol', deviceId, 'mac', mac);
				uci.set('timecontrol', deviceId, 'enable', '1');
			}

			var ruleId = 'rule_' + deviceId + '_' + Date.now();
			uci.add('timecontrol', 'timeslot', ruleId);
			uci.set('timecontrol', ruleId, 'device', deviceId);
			uci.set('timecontrol', ruleId, 'weekdays', weekdays.join(' '));
			uci.set('timecontrol', ruleId, 'start_time', startTime.value);
			uci.set('timecontrol', ruleId, 'stop_time', stopTime.value);
			uci.set('timecontrol', ruleId, 'rule_type', 'allow');
			uci.set('timecontrol', ruleId, 'enable', '1');

			commitChanges().then(function() {
				location.reload();
			}).catch(reportError);
		});

		var form = E('div', { 'class': 'timecontrol-form' }, [
			E('h4', {}, '添加新的时间控制规则'),
			E('div', { 'class': 'timecontrol-row' }, [ E('label', {}, '选择设备:'), select ]),
			E('div', { 'class': 'timecontrol-row' }, [
				E('label', {}, '手动输入:'), manualNameInput, manualMacInput
			]),
			E('div', { style: 'font-size:12px;color:#666;margin:-5px 0 10px 100px' },
				'列表为空时可手动填写设备名称和 MAC 地址，填写后优先使用手动输入'),
			E('div', { 'class': 'timecontrol-row' }, [ E('label', {}, '生效日期:'), shortcutRow ]),
			weekdayRow,
			E('div', { 'class': 'timecontrol-row' }, [
				E('label', {}, '开始时间:'), startTime,
				E('label', { style: 'margin-left:20px' }, '结束时间:'), stopTime
			]),
			E('div', { 'class': 'timecontrol-row' }, [ submitButton ])
		]);

		var tbody = E('tbody');

		function buildEditRow(slot, device) {
			var weekdaysInput = E('input', {
				type: 'text',
				value: String(slot.weekdays || ''),
				title: '例如: Mon Tue Wed Thu Fri',
				style: 'width:150px'
			});
			var startInput = E('input', { type: 'time', value: slot.start_time || '' });
			var stopInput = E('input', { type: 'time', value: slot.stop_time || '' });
			var typeSelect = E('select', {}, [
				E('option', { value: 'allow' }, '允许'),
				E('option', { value: 'deny' }, '禁止')
			]);
			typeSelect.value = slot.rule_type || 'allow';

			var enableSelect = E('select', {}, [
				E('option', { value: '1' }, '启用'),
				E('option', { value: '0' }, '禁用')
			]);
			enableSelect.value = String(slot.enable || '1') === '0' ? '0' : '1';

			var saveButton = E('button', {
				type: 'button',
				'class': 'timecontrol-btn timecontrol-add'
			}, '保存');
			var cancelButton = E('button', {
				type: 'button',
				'class': 'timecontrol-btn'
			}, '取消');

			saveButton.addEventListener('click', function() {
				var days = weekdaysInput.value.trim();
				if (!days || !startInput.value || !stopInput.value) {
					alert('请填写星期、开始时间和结束时间');
					return;
				}

				uci.set('timecontrol', slot['.name'], 'weekdays', days);
				uci.set('timecontrol', slot['.name'], 'start_time', startInput.value);
				uci.set('timecontrol', slot['.name'], 'stop_time', stopInput.value);
				uci.set('timecontrol', slot['.name'], 'rule_type', typeSelect.value);
				uci.set('timecontrol', slot['.name'], 'enable', enableSelect.value);

				commitChanges().then(function() {
					location.reload();
				}).catch(reportError);
			});

			cancelButton.addEventListener('click', function() {
				location.reload();
			});

			return E('tr', {}, [
				E('td', {}, String(device.name || '未知设备')),
				E('td', {}, String(device.mac || '')),
				E('td', {}, weekdaysInput),
				E('td', {}, [ startInput, ' - ', stopInput ]),
				E('td', {}, [ typeSelect, enableSelect ]),
				E('td', {}, [ saveButton, cancelButton ])
			]);
		}

		slots.forEach(function(slot) {
			var device = devicesByName[slot.device];

			if (!device)
				return;

			var weekdays = String(slot.weekdays || '').split(/\s+/).filter(Boolean).map(function(day) {
				var found = WEEKDAYS.filter(function(d) { return d[0] === day; })[0];
				return found ? found[1] : day;
			}).join(' ');

			// 旧配置没有 enable 选项时视为启用
			var ruleEnabled = String(slot.enable || '1') !== '0';

			var toggleButton = E('button', {
				type: 'button',
				'class': 'timecontrol-btn ' + (ruleEnabled ? 'timecontrol-disable' : 'timecontrol-enable')
			}, ruleEnabled ? '禁用' : '启用');

			toggleButton.addEventListener('click', function() {
				uci.set('timecontrol', slot['.name'], 'enable', ruleEnabled ? '0' : '1');
				commitChanges().then(function() {
					location.reload();
				}).catch(reportError);
			});

			var editButton = E('button', {
				type: 'button',
				'class': 'timecontrol-btn timecontrol-edit'
			}, '编辑');

			editButton.addEventListener('click', function() {
				var row = editButton.parentNode.parentNode;
				row.parentNode.replaceChild(buildEditRow(slot, device), row);
			});

			var deleteButton = E('button', {
				type: 'button',
				'class': 'timecontrol-btn timecontrol-delete'
			}, '删除');

			deleteButton.addEventListener('click', function() {
				if (!confirm('确定要删除该控制规则吗？'))
					return;

				var ruleId = slot['.name'];
				var owner = slot.device;
				var otherRules = slots.filter(function(s) {
					return s.device === owner && s['.name'] !== ruleId;
				});

				uci.remove('timecontrol', ruleId);

				if (owner && otherRules.length === 0 && devicesByName[owner])
					uci.remove('timecontrol', owner);

				commitChanges().then(function() {
					location.reload();
				}).catch(reportError);
			});

			tbody.appendChild(E('tr', {}, [
				E('td', {}, String(device.name || '未知设备')),
				E('td', {}, String(device.mac || '')),
				E('td', {}, weekdays),
				E('td', {}, (slot.start_time || '') + ' - ' + (slot.stop_time || '')),
				E('td', {}, ruleEnabled ? '启用' : '禁用'),
				E('td', {}, [ editButton, toggleButton, deleteButton ])
			]));
		});

		return E('div', {}, [
			style,
			E('h3', {}, '设备时间控制列表'),
			form,
			E('table', { 'class': 'timecontrol-table', id: 'rules-table' }, [
				E('thead', {}, E('tr', {}, [
					E('th', {}, '设备'),
					E('th', {}, 'MAC地址'),
					E('th', {}, '生效日期'),
					E('th', {}, '允许时间'),
					E('th', {}, '状态'),
					E('th', {}, '操作')
				])),
				tbody
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
