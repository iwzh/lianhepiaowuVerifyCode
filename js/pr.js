(function($, BT) {
	/**
	 * 获取应用本地配置
	 **/
	function getSettings() {
		var settingsText = localStorage.getItem('$settings') || "{}";
		return JSON.parse(settingsText);
	};
	/**
	 * 提示功能
	 * @param {Object} msg
	 * @param {Object} ttt
	 */
	function toast(msg, ttt) {
		var tt = ttt || 800;
		$.toast(msg, {
			duration: tt
		});
	};
	/**
	 * 判断是否为空
	 * @param {Object} obj
	 */
	function isEmptyObject(obj) {
		for(var name in obj) {
			return false;
		}
		return true;
	};
	var options = new Object();
	options.device = null;
	options.BluetoothAdapter = null;
	options.BAdapter = null;
	options.UUID = null;
	options.uuid = null;
	options.main = null;
	options.bluetoothSocket = null;
	options.BluetoothDevice = null;
	options.IntentFilter = null;
	options.mac_address = null;

	var mac_address = null;
	var agintry = 0;
	var defaultpage = "tab-webview-subpage-bluetooth.html";

	//定义 Bluetooth 类
	var Bluetooth = $.Bluetooth = $.Class.extend({
		/**
		 * 构造函数
		 * */
		init: function(options) {
			var self = this;
			options = options || {};
			if(isEmptyObject(options)) {
				//console.log('options is null');
				options = self.options;
			}
			if(isEmptyObject(options)) {
				//console.log('self.options is null too');
				options = {};
				options.main = plus.android.runtimeMainActivity();
				options.BluetoothAdapter = plus.android.importClass("android.bluetooth.BluetoothAdapter");
				options.BAdapter = options.BluetoothAdapter.getDefaultAdapter();
				options.Intent = plus.android.importClass("android.content.Intent");
				options.IntentFilter = plus.android.importClass('android.content.IntentFilter');
				self.options = options;
			}
			if(options.main == null) {
				//console.log('main null');
				options.main = self.options.main || plus.android.runtimeMainActivity();
			}
			if(options.BluetoothAdapter == null) {
				//console.log('bluetoothAdapter null');
				options.BluetoothAdapter = self.options.BluetoothAdapter || plus.android.importClass("android.bluetooth.BluetoothAdapter");
				options.BAdapter =options.BAdapter ||self.options.BAdapter || options.BluetoothAdapter.getDefaultAdapter();
			}
			if(options.BAdapter == null) {
				options.BAdapter = self.options.BAdapter || options.BluetoothAdapter.getDefaultAdapter();
			} else {
				//console.log('BAdapter:' + options.BAdapter);
			}

			//设置蓝牙可见性时用得到
			/*if(options.Intent == null) {
				self.options.Intent =  self.options.Intent || plus.android.importClass("android.content.Intent");
			}*/
			self.options=options;
			if(self.openBluetooth(self.options.BAdapter)) {
//				//console.log('蓝牙已开启');	
			} else {
				toast('开启蓝牙失败,无法使用蓝牙打印机;请手动设置权限后，重新打开');
			}
		},
		/**
		 * 获取本地存储的蓝牙列表
		 **/
		getBlueList: function() {
			var stateText = localStorage.getItem('$bluetoothlist') || "{}";
			return JSON.parse(stateText);
		},
		/**
		 * 设置本地存储的蓝牙列表
		 **/
		setBlueList: function(state) {
			state = state || {};
			localStorage.setItem('$bluetoothlist', JSON.stringify(state));
		},
		/*
		 * 清除本地存储的蓝牙列表
		 */
		clearBlueList: function() {
			this.setBlueList({});
		},
		/*
		 * 获取保存的蓝牙连接地址
		 */
		getMacAddress: function() {
			var settings = getSettings();
			settings.bluestate = 1;
			if(settings.bluestate) {
				var address = localStorage.getItem('$bluetoothMacAddress') || "";
				return address;
			} else {
				//console.log('未开启蓝牙打印设置');
				return false;
			}
		},
		/*
		 * 设置保存蓝牙连接的地址
		 */
		setMacAddress: function(address) {
			address = address || '';
			localStorage.setItem('$bluetoothMacAddress', address);
		},
		/*
		 * 测试打印
		 */
		testprint: function(mac_address, teststr, device, bluetoothSocket) {
			teststr = teststr || "这是测试打印的。内容可以忽略 ";
			var status = this.print(mac_address, teststr, device, bluetoothSocket,true);
			return status || false;
		},
		/**
		 * 打印
		 */
		print: function(mac_address, printstring, device, bluetoothSocket,debug) {
			var self = this;
			debug=debug||false;
			if(!mac_address) {
				var mac_address = self.getMacAddress();
				if(!mac_address) {
					toast('请选择蓝牙打印机');
					return false;
				}
			}
			self.initParam({
				"mac_address": mac_address
			}, 1);
			bluetoothSocket = self.options.bluetoothSocket;
			self.connectedBT(bluetoothSocket, mac_address);
			if(bluetoothSocket.isConnected()) {
				var outputStream = bluetoothSocket.getOutputStream();
				plus.android.importClass(outputStream);
				var bytes = plus.android.invoke(printstring, 'getBytes', 'gbk');
				var clearFormat = [0x1b, 0x40]; //复位打印机
				outputStream.write(clearFormat);
				/*start *** 文字加粗*/
				/*
				outputStream.write([0x1b,0x45,1]);
				var title=plus.android.invoke("【联合票务】", 'getBytes', 'gbk');				
				outputStream.write(title);
				outputStream.write([0x1b,0x45,0]);
				*/
				/*end *** 文字加粗*/
				outputStream.write(bytes);
				//多走纸n行
				outputStream.write([0x1b, 0x64, 4]);
				if(debug) {
					outputStream.flush();
					//self.options.device = null //清空连接设备 如果持续验票的情况下，不能每次都初始化设备。只需要关闭蓝牙与手机APP的socket即可。无需情况设备
					bluetoothSocket.close(); //必须关闭蓝牙连接否则意外断开的话打印错误
				} else {
					setTimeout(function() {
						outputStream.flush();
						//self.options.device = null //清空连接设备 如果持续验票的情况下，不能每次都初始化设备。只需要关闭蓝牙与手机APP的socket即可。无需情况设备
						bluetoothSocket.close(); //必须关闭蓝牙连接否则意外断开的话打印错误
					}, 1000);
				}
			} else {
				toast("蓝牙连接失败，无法打印");
			}
			return true;
		},
		/*
		 * 成功的提示
		 */
		confirm: function(mac_address) {
			var self = this;
			var confirm_title = '测试打印';
			var confirm_tips = '蓝牙已连接成功，是否测试打印？';
			if($.os.plus) {
				mac_address = mac_address || self.options.mac_address || self.getMacAddress();
				var btnArray = ['是', '否'];
				$.confirm(confirm_tips, confirm_title, btnArray, function(e) {
					if(e.index == 0) {
						self.print(mac_address)
					} else {
						//console.log('取消');
					}
				});
			} else {
				alert("成功");
			}
		},
		/*
		 * 开启蓝牙 
		 */
		openBluetooth: function(BAdapter) {
			var self = this;
			if(!BAdapter) {
				BAdapter = self.options.BAdapter;
				if(!BAdapter) {
					//console.log('BAdapter 不存在');
					self.init();
					BAdapter = self.options.BAdapter;
				}
			}
			if(!BAdapter.isEnabled()) {
				//console.log('检测到未打开蓝牙,尝试打开中....');
				toast('检测到未打开蓝牙,尝试打开中....', 600);
				var status = BAdapter.enable();
				if(status) {
					//console.log('已为您开启蓝牙...');
					toast('已成功为您开启蓝牙', 600);
					//设置蓝牙可见性					
				
				}else{
					//console.log('开启蓝牙失败,请手动开启蓝牙');
					toast('开启蓝牙失败,请手动开启蓝牙', 600);
					return false;
				}
			}
			return true;
		},
		initParam: function(options, checkSocket, checkDevice) {
			var self = this;
			checkSocket = checkSocket || 0;
			checkDevice = checkDevice || 0;
				if(self.options.mac_address == options.mac_address) {
					//console.log('mac_address ==');
					if(!self.options.BAdapter) {
						self.init(options);
						//console.log('options ==');
					}
				} else {
					//console.log('mac_address !=');
					self.init(options);
				}
			if(options.mac_address) {		
				self.options.device = options.device || self.options.BAdapter.getRemoteDevice(options.mac_address);
				plus.android.importClass(self.options.device);		
			}
			//蓝牙连接或者uuid为空时，需要重新导入蓝牙socket
			if(checkSocket) {
				/*检查Socket时,要么导入Socket要么给Socket初始值*/
				self.options.UUID = options.UUID || plus.android.importClass("java.util.UUID");
				self.options.uuid = options.uuid || self.options.UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
				self.options.bluetoothSocket = self.options.device.createInsecureRfcommSocketToServiceRecord(self.options.uuid);
				plus.android.importClass(self.options.bluetoothSocket);
			}
			if(checkDevice) {
				//蓝牙信息	
				self.options.BluetoothDevice = options.BluetoothDevice || self.options.BluetoothDevice || plus.android.importClass("android.bluetooth.BluetoothDevice");
				//搜索蓝牙时候用到
				if(options.IntentFilter == null) {
					self.options.IntentFilter = self.options.IntentFilter || plus.android.importClass('android.content.IntentFilter');
				}
			}
			return self;
		},
		/*
		 * 连接蓝牙
		 */
		connectedBT: function(bluetoothSocket, mac_address) {
			var self = this;
			if(!bluetoothSocket.isConnected()) {
				if(agintry > 5) {
					//console.log('重试' + agintry + '次了，不再尝试');
					toast("重试多次未成功连接蓝牙打印机，请关闭后重试！");
					bluetoothSocket.close();
					self.initParam({
						"mac_address": mac_address
					}, 1, 1);
					self.options.device = null;
					self.options.UUID = null;
					self.options.uuid = null;
					agintry = 0;
					return false;
				}
				try {
					bluetoothSocket.connect();
				} catch(e) {
					//console.log('Bluetooth Connect Error!' + e);
					bluetoothSocket.close();
					self.initParam({
						"mac_address": mac_address
					}, 1, 1);
					//console.log('设备连接出错了，重新连接');
					bluetoothSocket = self.options.bluetoothSocket;
					agintry++;
					try {
						bluetoothSocket.connect();
					} catch(e) {
						//console.log("设备连接出错，errCode:" + e);
					}
				}

				if(!bluetoothSocket.isConnected()) {
					toast('重新连接失败，请确保蓝牙设备开启。');
					return false;
				}
			}
			agintry = 0;
			return true;
		},
		/**
		 * 未配对蓝牙配对
		 * @param {Object} mac_address
		 */
		contactBT: function(mac_address) {
			var self = this;
			if(!mac_address) {
				toast('请选择蓝牙打印机');
				return;
			}
			self.initParam({
				"mac_address": mac_address
			}, 1, 1);
			var bdevice = new BluetoothDevice();
			var device = self.options.device;
			if(device.getBondState() == bdevice.BOND_NONE) {
				//地址一样，执行配对
				if(mac_address == device.getAddress()) {
					//console.log('正在执行配对');
					if(device.createBond()) {
						//第一次配对成功将配对成功的数据放入已配对蓝牙列表
						var _bluelist = self.getBlueList();
						var item = {
							"id": device.getAddress(),
							"name": device.getName()
						};
						_bluelist.push(item);
						self.setBlueList(_bluelist);
						//console.log("配对成功");						
					}
				}
			}
			self.connectedBT(self.options.bluetoothSocket, mac_address);
		},

		/**
		 * 扫描已配对蓝牙
		 */
		scan: function() {
			var self = this;
			BAdapter = self.options.BAdapter;
			var lists = BAdapter.getBondedDevices(); //获取配对的设备列表
			plus.android.importClass(lists);
			var iterator = lists.iterator();
			plus.android.importClass(iterator);
			var bluetoothList = new Array();
			while(iterator.hasNext()) {
				var d = iterator.next();
				plus.android.importClass(d);
				var item = {
					"id": d.getAddress(),
					"name": d.getName()
				};
				bluetoothList.push(item);
			}
			self.setBlueList(bluetoothList);
			return bluetoothList;
		},
		/*
		 * 取消蓝牙配对
		 */
		removeBlueDevices: function(mac_address, mac_name) {
			var self = this;
			if(!mac_address) {
				toast('请选择成功配对的蓝牙设备');
				return;
			}
			self.initParam({
				"mac_address": mac_address
			}, 1, 1);
			var device = self.options.device;
			BluetoothDevice = self.options.BluetoothDevice;
			var bdevice = new BluetoothDevice();
			if(device.getBondState() == bdevice.BOND_BONDED) {
				//地址一样，执行删除配对
				if(mac_address == device.getAddress()) {
					var btnArray = ['是', '否'];
					$.confirm('是否删除已配对的设备：' + mac_name + '？', '删除设备', btnArray, function(e) {
						if(e.index == 0) {
							if(device.removeBond()) {
								var _bluelist = self.getBlueList();
								var item = {
									"id": mac_address,
									"name": mac_name
								};
								var rebluelist = _bluelist.map(function(listiteam) {
									if(JSON.stringify(item) != JSON.stringify(listiteam)) {
										return listiteam;
									}
								});
								self.setBlueList(rebluelist);
								//console.log('删除配对蓝牙设备：' + mac_name + ' 成功');
								return true;
							}
						} else {
							//console.log('取消删除设备操作');
							return false;
						}
					});
				} else {
					//console.log("设备地址码不一致，不能删除");
					return false;
				}
			} else {
				//console.log("未配对设备，不能删除");
				return false;
			}
		},
		/*
		 * 搜索蓝牙设备,并创建处理HTML蓝牙列表
		 */
		seachBT: function(address) {
			var self = this;
			if(address) {
				self.initParam({
					"mac_address": address
				}, 0, 1);
			} else {
				self.initParam({}, 0, 1);
			}
			//检查蓝牙是否开启
			BAdapter = self.options.BAdapter;
			main = self.options.main;
			self.openBluetooth(BAdapter);
			IntentFilter = self.options.IntentFilter || plus.android.importClass('android.content.IntentFilter');
			BluetoothDevice = self.options.BluetoothDevice || plus.android.importClass("android.bluetooth.BluetoothDevice");
			var filter = new IntentFilter();
			var bdevice = new BluetoothDevice();
			var on = new Array(),
				un = new Array(),
				onstr = null,
				unstr = null;
			var BTSeatchList = new Object();
			BAdapter.startDiscovery(); //开启搜索
			var receiver;
			receiver = plus.android.implements('io.dcloud.android.content.BroadcastReceiver', {
				onReceive: function(context, intent) {
					//实现onReceiver回调函数
					plus.android.importClass(intent);
					//通过intent实例引入intent类，方便以后的‘.’操作
					//获取action
					//console.log(intent.getAction());
					if(intent.getAction() == "android.bluetooth.adapter.action.DISCOVERY_FINISHED") {
						//console.log("搜索结束,本地保存未配对设备和已配对设备");
						BTSeatchList.on = on;
						BTSeatchList.un = un;
						main.unregisterReceiver(receiver); //取消监听
						//事件数据
						var eventData = {
							sender: self,
							btsearchlist: BTSeatchList
						};
						//触发声明的DOM的自定义事件(暂定 done 为事件名，可以考虑更有针对的事件名 )
						var firepage = plus.webview.getWebviewById(defaultpage);
						$.fire(firepage, 'done', eventData);
					} else {
						var BleDevice = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
						//判断是否配对
						if(BleDevice.getBondState() == bdevice.BOND_NONE) {
							//判断防止重复添加
							if(BleDevice.getName() != unstr) {
								unstr = BleDevice.getName();
								//console.log('未配对蓝牙设备：' + unstr + '    ' + BleDevice.getAddress());
								var unitem = {
									"id": BleDevice.getAddress(),
									"name": unstr
								};
								un.push(unitem);
							}
						} else {
							//判断防止重复添加
							if(onstr != BleDevice.getName()) {
								onstr = BleDevice.getName();
								//console.log("已配对蓝牙设备：" + onstr + '    ' + BleDevice.getAddress());
								var onitem = {
									"id": BleDevice.getAddress(),
									"name": onstr
								};
								on.push(onitem);
							}
						}
					}
				}
			});
			filter.addAction(bdevice.ACTION_FOUND); //搜索设备  
			filter.addAction(BAdapter.ACTION_DISCOVERY_STARTED);
			filter.addAction(BAdapter.ACTION_DISCOVERY_FINISHED);
			filter.addAction(BAdapter.ACTION_STATE_CHANGED);

			filter.addAction(BAdapter.ACTION_STATE_CHANGED); //监听蓝牙开关
			main.registerReceiver(receiver, filter); //注册监听
		},
		/*
		 * 数组去重
		 */
		arrayUnique: function(a) {
			var seen = {};
			return a.filter(function(item) {
				item = JSON.stringify(item);
				return seen.hasOwnProperty(item) ? false : (seen[item] = true);
			});
		}
	});

	//添加 Bluetooth 插件
	$.fn.bluetooth = function(options) {
		var self = this[0];
		var bluetooth = null;
		options = options || null;
		bluetooth = new Bluetooth(options);
		return bluetooth;
	};
})(mui, window);