(function($, BT) {
	/**
	 * 获取应用本地配置
	 **/
	 function getSettings() {
		var settingsText = localStorage.getItem('$settings') || "{}";
		return JSON.parse(settingsText);
	}
	 
	//清除以配对蓝牙设备
	BT.clearblue = function() {
		BT.setBlueList({});
	}
	
	//检查是否已打开蓝牙
	BT.IsEnabled = function (){
		var Bluesettings=getBlueSettings();
		var BAdapter=Bluesettings.BAdapter;
		if(!BAdapter.isEnabled()) {
			mui.toast('检测到未打开蓝牙,尝试打开中....');
			var status = BAdapter.enable();
			if(status){
				mui.toast('已为您开启蓝牙,正在搜索设备...');
			}else{
				mui.toast('开启蓝牙失败,请手动开启蓝牙');
				return false; 
			}
		}
		return true;
	}
	
	
	/**
	 * 获取蓝牙配置
	 **/
	BT.setBlueSettings = function(bluesettings) {
		bluesettings = bluesettings || {};
		localStorage.setItem('$bluesettings', JSON.stringify(bluesettings));
	}

	/**
	 * 设置蓝牙本地配置
	 **/
	BT.getBlueSettings = function() {
		var settingsText = localStorage.getItem('$bluesettings') || "{}";
		return JSON.parse(settingsText);
	}

	
	
	
		
		var device = null,
			BluetoothAdapter = null,
			BAdapter = null,
			UUID = null,
			uuid = null,
			main = null,
			bluetoothSocket = null,
			BluetoothDevice = null,
			IntentFilter=null;
			
	//定义 Locker 类
	var Bluetooth = $.Bluetooth = $.Class.extend({
		/**
		 * 构造函数
		 * */
		init: function(holder, options) {
			var self = this;
			//
			options = options || {};
			options.callback = options.callback || options.done ;
			self.options = options;			
			self.device = self.options.device || device;			
			if(self.device==null){			
				self.main = plus.android.runtimeMainActivity();
				self.BluetoothAdapter = self.options.BluetoothAdapter || BluetoothAdapter || plus.android.importClass("android.bluetooth.BluetoothAdapter");
				self.BAdapter = self.options.BAdapter || BAdapter || BluetoothAdapter.getDefaultAdapter();	
//				self.device = self.options.device || device || BAdapter.getRemoteDevice(mac_address);
//				plus.android.importClass(device);
			}		
			if(self.oepnBluetooth(self.BAdapter)){
			/*	//搜索蓝牙时候用到
				if(self.IntentFilter==null){
					self.IntentFilter = self.options.BluetoothAdapter || plus.android.importClass('android.content.IntentFilter') || self.IntentFilter;	
				}*/
			}else{
				$.toast('开启蓝牙失败,无法使用蓝牙打印机;请手动设置权限后，重新打开');
			}
		},

		/**
		 * 扫描已配对蓝牙
		 */
		scan: function(options) {
			var self = this;
			BAdapter=self.options.BAdapter || options.BAdapter|| BAdapter;
			var lists = BAdapter.getBondedDevices(); //获取配对的设备列表
				plus.android.importClass(lists);
				var iterator = lists.iterator();
				plus.android.importClass(iterator);
				var bluetoothList=new Array();
				while(iterator.hasNext()) {
					var d = iterator.next();
					plus.android.importClass(d);
					var item='{"id":'+d.getAddress()+',"name":'+d.getName()+'}';
					bluetoothList.push(item);
				}
				self.setBlueList(bluetoothList);
			return bluetoothList;
		},
		/**
		 * 获取本地存储的蓝牙列表
		 **/
		getBlueList : function() {
			var stateText = localStorage.getItem('$bluetoothlist') || "{}";
			return JSON.parse(stateText);
		},

		/**
		 * 设置本地存储的蓝牙列表
		 **/
		setBlueList:function(state) {
			state = state || {};
			localStorage.setItem('$bluetoothlist', JSON.stringify(state));
		},
		/*
		 * 获取保存的蓝牙连接地址
		 */
		getMacAddress:function(){
			var settings=getSettings();
			if(settings.bluestate){
				var address = localStorage.getItem('$bluetoothMacAddress') || "";
				return address;
			}else{
				console.log('未开启蓝牙打印设置');
				return false;
			}
		},
		/*
		 * 设置保存蓝牙连接的地址
		 */
		setMacAddress:function(address){
			address=address||'';
			localStorage.setItem('$bluetoothMacAddress', address);
		},
		/*
		 * 测试打印
		 */
		testprint:function(mac_address,device,bluetoothSocket,teststr){
			teststr=teststr||"测试打印机\r\n\r\n\r\n\r\n\r\n\r\n这是测试打印的。内容可以忽略";
			this.print(mac_address,device,bluetoothSocket,teststr);
		},
		/*
		 * 连接蓝牙
		 */
		connectedBT:function(bluetoothSocket){
			if(!bluetoothSocket.isConnected()) {
				console.log('检测到设备未连接，尝试连接....');
				bluetoothSocket.connect();
				if(!bluetoothSocket.isConnected()) {
					mui.toast('设备未连接，重新连接失败，请确保设备开启。');
				}else{
					mui.toast('设备已连接。');
				}
			}
			console.log('设备已连接 bluetoothSocket.isConnected()=' + bluetoothSocket.isConnected());
		},
		/**
		 * 打印
		 */
		print: function(mac_address, device, bluetoothSocket, printstring) {			
			var self = this;
			if(!mac_address) {
				var mac_address=self.getMacAddress();
				if(!mac_address){				
					mui.toast('请选择蓝牙打印机');
					return;	
				}
			}
			if(device == null) {
				main = plus.android.runtimeMainActivity();
				BluetoothAdapter = plus.android.importClass("android.bluetooth.BluetoothAdapter");
				BAdapter = BluetoothAdapter.getDefaultAdapter();
				device = BAdapter.getRemoteDevice(mac_address);
				plus.android.importClass(device);
			}
			
			//蓝牙连接或者uuid为空时，需要重新导入蓝牙socket
			if(bluetoothSocket== null||UUID ==null){					
				UUID = plus.android.importClass("java.util.UUID");
				uuid = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
			}
			
			bluetoothSocket = device.createInsecureRfcommSocketToServiceRecord(uuid);
			plus.android.importClass(bluetoothSocket);

			self.connectedBT(bluetoothSocket);//检测蓝牙是否连接；
			

			if(bluetoothSocket.isConnected()) {
				/*
				bluetoothSocket.start();//开启蓝牙socket连接，不开启无法打印
				bluetoothSocket.accept();//开启蓝牙socket连接，不开启无法打印
				bluetoothSocket.start();//开启蓝牙socket连接，不开启无法打印
				*/
				var outputStream = bluetoothSocket.getOutputStream();
				plus.android.importClass(outputStream); 
				var bytes = plus.android.invoke(printstring, 'getBytes', 'gbk');
				var clearFormat = [0x1b, 0x40]; //复位打印机
				outputStream.write(clearFormat);
				outputStream.write(bytes);
				outputStream.flush();
				/*//device = null //清空连接设备 如果持续验票的情况下，不能每次都初始化设备。只需要关闭蓝牙与手机APP的socket即可。无需情况设备*/
				bluetoothSocket.close(); //必须关闭蓝牙连接否则意外断开的话打印错误
			}else{
				$.toast("蓝牙未连接，无法打印");
			}
		},

		/*
		 * 开启蓝牙 
		 */
		oepnBluetooth:function(BAdapter){
			var self=this;
			BAdapter=self.options.BAdapter || options.BAdapter|| BAdapter;
			if(!BAdapter.isEnabled()) {
				console.log('检测到未打开蓝牙,尝试打开中....');
				var status = BAdapter.enable();
				if(status){
					console.log('已为您开启蓝牙,正在搜索设备...');
				}else{
					console.log('开启蓝牙失败,请手动开启蓝牙');
					return false; 
				}
			}
			return true;
		},
		seachBT:function(device,bluetoothSocket,IntentFilter,BluetoothDevice){
			var self=this;
			self.device=device||self.device;
				if(self.device == null) {
					self.main = plus.android.runtimeMainActivity();
					self.BluetoothAdapter = plus.android.importClass("android.bluetooth.BluetoothAdapter");
					self.BAdapter = BluetoothAdapter.getDefaultAdapter();
				}
				//检查蓝牙是否开启
				checkBluetoothIsEnabled();
				IntentFilter=IntentFilter||plus.android.importClass('android.content.IntentFilter');	
				BluetoothDevice=BluetoothDevice||plus.android.importClass("android.bluetooth.BluetoothDevice");
				
				var filter = new IntentFilter();
				var bdevice = new BluetoothDevice();
				var on = un = null;
				
				BAdapter.startDiscovery(); //开启搜索
				var receiver;
				receiver = plus.android.implements('io.dcloud.android.content.BroadcastReceiver', {
					onReceive: function(context, intent) { 
						//实现onReceiver回调函数
						plus.android.importClass(intent); 
						//通过intent实例引入intent类，方便以后的‘.’操作
						//获取action
						console.log(intent.getAction()); 

						if(intent.getAction() == "android.bluetooth.adapter.action.DISCOVERY_FINISHED") {
							console.log("搜索结束")
							main.unregisterReceiver(receiver); //取消监听
						
						} else {
							BleDevice = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
							//判断是否配对
							if(BleDevice.getBondState() == bdevice.BOND_NONE) {
								console.log("未配对蓝牙设备：" + BleDevice.getName() + '    ' + BleDevice.getAddress());
								
								var unitem='{"id":'+BleDevice.getAddress()+',"name":'+BleDevice.getName()+'}';
								un.push(unitem);
								
								//参数如果跟取得的mac地址一样就配对
								if(address == BleDevice.getAddress()) {
									//配对命令.createBond()
									if(BleDevice.createBond()) {
										console.log("配对成功");
										var onitem='{"id":'+BleDevice.getAddress()+',"name":'+BleDevice.getName()+'}';
										on.push(onitem);
										/*on= BleDevice.getName();
										var li1='<li class="mui-table-view-cell" id="'+BleDevice.getAddress()+'"><a href="" class="mui-navigate-right">'+on+'<span class="mui-badge mui-badge-success">已连接</span></a></li>';
										var ulinto=vlist1.innerHTML;
										vlist1.innerHTML=ulinto+li1;*/
										
									}else{
										mui.toast('配对失败！请手动前往蓝牙界面。取消配对后，重试！');
										return;
									}
								} else {
									//判断防止重复添加
									if(BleDevice.getName() != un) {
										var unitem='{"id":'+BleDevice.getAddress()+',"name":'+BleDevice.getName()+'}';
								un.push(unitem);
										/*
										un = BleDevice.getName();
										var li2 ='<li class="mui-table-view-cell" id="'+BleDevice.getAddress()+'"><a href="" class="mui-navigate-right">'+un+'<span class="mui-badge mui-badge-red">未配对</span></a></li>';
										var ulinto=vlist2.innerHTML;
										vlist2.innerHTML=ulinto+li2;*/
									}
								}
							} else {
								//判断防止重复添加
								if(BleDevice.getName() != on) { 
									console.log("已配对蓝牙设备：" + BleDevice.getName() + '    ' + BleDevice.getAddress());																
//									on = BleDevice.getName();
									var onitem='{"id":'+BleDevice.getAddress()+',"name":'+BleDevice.getName()+'}';
									on.push(onitem);
								}							
							}
						}

					}
				});

				filter.addAction(bdevice.ACTION_FOUND);//搜索设备  
				filter.addAction(BAdapter.ACTION_DISCOVERY_STARTED);
				filter.addAction(BAdapter.ACTION_DISCOVERY_FINISHED);
				filter.addAction(BAdapter.ACTION_STATE_CHANGED);
				
				filter.addAction(BAdapter.ACTION_STATE_CHANGED); //监听蓝牙开关

				main.registerReceiver(receiver, filter); //注册监听
		},		
	});

	
	/*$.fn.bluetooth = function(options) {
		var self = this[0];
		
		var bluetooth = null;
		var id = self.getAttribute('data-view');
		if (!id) {
			id = ++$.uuid;
			$.data[id] = bluetooth = new bluetooth(self, options);
		} else {
			viewApi = $.data[id];
		}
		return viewApi;
	}*/
	//添加 Bluetooth 插件
	$.fn.bluetooth = function(options) {
		//遍历选择的元素
		this.each(function(i, element) {
			if (element.bluetooth) return;
			if (options) {
				element.bluetooth = new Bluetooth(element, options);
			} else {
				var optionsText = element.getAttribute('data-bluetooth-options');
				var _options = optionsText ? JSON.parse(optionsText) : {};
				_options.device = element.getAttribute('data-bluetooth-device') || _options.bluedevice;
				element.bluetooth = new Bluetooth(element, _options);
			}
		});
		return this[0] ? this[0].locker : null;
	};

	
})(mui, window);