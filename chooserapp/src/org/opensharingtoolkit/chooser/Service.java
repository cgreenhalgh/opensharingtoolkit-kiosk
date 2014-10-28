/**
 * 
 */
package org.opensharingtoolkit.chooser;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.net.NetworkInterface;
import java.net.URLDecoder;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.json.JSONException;
import org.json.JSONObject;
import org.opensharingtoolkit.httpserver.HttpContinuation;
import org.opensharingtoolkit.httpserver.HttpError;
import org.opensharingtoolkit.httpserver.HttpListener;
import org.opensharingtoolkit.httpserver.HttpUtils;
import org.opensharingtoolkit.chooser.R;
import org.opensharingtoolkit.chooser.SharedMemory.Encoding;
import org.opensharingtoolkit.common.Hotspot;
import org.opensharingtoolkit.common.Recorder;
import org.opensharingtoolkit.common.WifiUtils;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.ServiceConnection;
import android.content.SharedPreferences;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.content.pm.PackageInfo;
import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.net.wifi.SupplicantState;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.preference.PreferenceManager;
import android.support.v4.app.NotificationCompat;
import android.util.Log;

/**
 * @author pszcmg
 *
 */
public class Service extends android.app.Service implements OnSharedPreferenceChangeListener {

	private IBinder mBinder = new LocalBinder();
	
	private static final String TAG = "kiosk-service";
	private static final int SERVICE_NOTIFICATION_ID = 1;
	private HttpListener httpListener = null;
	public static final int HTTP_PORT = 8080;
	private boolean mIsBoundTo = false;
	
	// 5 minutes ?!
	private static final long CACHE_ASSET_TIME_MS = 1000*60*5;
    // 5 minutes ?!
	private static final long CACHE_FILE_TIME_MS = 1000*60*5;

	private static final long FINISH_DELAY_MS = 1000;
	private static int port = HTTP_PORT;
	private Recorder mRecorder = new Recorder(this, "chooser.service");
	private boolean started = false;
	
	@Override
	public void onCreate() {
		super.onCreate();
		
		Log.d(TAG,"service onCreate");
	}
	
	private void onStart() {
		if (started)
			return;
		started = true;
			
		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(this);
		spref.registerOnSharedPreferenceChangeListener(this);
		
		// notification
		// API level 11
		Notification notification = new NotificationCompat.Builder(getApplicationContext())
				.setContentTitle(getText(R.string.notification_title))
				.setContentText(getText(R.string.notification_description))
				.setSmallIcon(R.drawable.notification_icon)
				.setContentIntent(PendingIntent.getActivity(this, 0, new Intent(this, SettingsActivity.class), 0))
				.build();

		startForeground(SERVICE_NOTIFICATION_ID, notification);
				
		httpListener = new HttpListener(this, HTTP_PORT);
		httpListener.start();
		
		// bind the hotspot service
		Intent i = new Intent();
		i.setClassName("org.opensharingtoolkit.hotspot","org.opensharingtoolkit.hotspot.HotspotService");
        try {
        	boolean res = bindService(i, mConnection, Context.BIND_AUTO_CREATE);
        	if (res)
        		Log.i(TAG,"successful bindService for HotspotService");
        	else
        		Log.w(TAG,"Unable to bindService to HotspotService");
        }
        catch (Exception e) {
        	Log.e(TAG,"Error binding to HotspotService", e);
        }
        
        // attempt to redirect port
        redirectPort(80, HTTP_PORT);
        queryCaptiveportal();
        
        // monitor network state to cache
		IntentFilter intentFilter = new IntentFilter();
		//intentFilter.addAction(WifiManager.NETWORK_STATE_CHANGED_ACTION);
		intentFilter.addAction(WifiManager.WIFI_STATE_CHANGED_ACTION);
		intentFilter.addAction(WifiUtils.WIFI_AP_STATE_CHANGED_ACTION);
		registerReceiver(mWifiReceiver, intentFilter);
		updateNetworkState();
		
		mFinishHandler.postDelayed(mCheckFinish, FINISH_DELAY_MS);
	}

	@Override
	public void onDestroy() {
		Log.d(TAG,"service onDestroy");
		super.onDestroy();
		onStop();
	}
	
	private void onStop() {
		if (!started)
			return;
		started = false;
		
		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(this);
		spref.unregisterOnSharedPreferenceChangeListener(this);

		unregisterReceiver(mWifiReceiver);

		// Unbind from the Hotspot service
		try {
            unbindService(mConnection);
        }
		catch (Exception e) {
			Log.e(TAG,"Error unbinding hotspot service: "+e);
		}
		// removes notification!
		stopForeground(true);
		
		if (httpListener!=null) {
			try {
				httpListener.close();
			} catch (Exception e) {
				Log.d(TAG,"error closing httplistener", e);
			}
			httpListener = null;
		}
	}
	
	public static int getPort() {
		return port;
	}
	
    /** Messenger for communicating with the Hotspot service. */
    private Messenger mService = null;

    /** Flag indicating whether we have called bind on the service. */
    private boolean mBound;

    /** pending messages */
    private List<Message> mPendingMessages = new LinkedList<Message>();
    
    /**
     * Class for interacting with the main interface of the service.
     */
    private ServiceConnection mConnection = new ServiceConnection() {
        public void onServiceConnected(ComponentName className, IBinder service) {
            // This is called when the connection with the service has been
            // established, giving us the object we can use to
            // interact with the service.  We are communicating with the
            // service using a Messenger, so here we get a client-side
            // representation of that from the raw IBinder object.
            mService = new Messenger(service);
        	Log.d(TAG,"HotspotService connected");
            synchronized (Service.this) {
            	mBound = true;
            }
           	sendPendingMessages();
        }

        public void onServiceDisconnected(ComponentName className) {
            // This is called when the connection with the service has been
            // unexpectedly disconnected -- that is, its process crashed.
            mService = null;
            mBound = false;
            Log.d(TAG,"HotspotService disconnected");
        }
    };

    private void redirectPort(int fromPort, int toPort) {
        Message msg = Hotspot.getRedirectPortMessage(fromPort, toPort);
        msg.replyTo = mHotspotMessenger;
        synchronized (this) {
        	if (!mBound) {
        		Log.d(TAG,"Queue redirectPort "+fromPort+" -> "+toPort);
    			mPendingMessages.add(msg);
    			msg = null;
        	}
        }
        if (msg!=null) {
			try {
				Log.d(TAG,"Send redirectPort "+fromPort+" -> "+toPort);
				mService.send(msg);
			} catch (RemoteException e) {
				Log.w(TAG,"Error sending redirectPort", e);
		        synchronized (this) {
		        	// try again later?
	    			mPendingMessages.add(msg);
		        }
			}
        }
    }
    private void queryCaptiveportal() {
        Message msg = Hotspot.getQueryCaptiveportalMessage(true);
        msg.replyTo = mHotspotMessenger;
        synchronized (this) {
        	if (!mBound) {
        		Log.d(TAG,"Queue queryCaptiveportal");
    			mPendingMessages.add(msg);
    			msg = null;
        	}
        }
        if (msg!=null) {
			try {
				Log.d(TAG,"Send queryCaptiveportal");
				mService.send(msg);
			} catch (RemoteException e) {
				Log.w(TAG,"Error sending redirectPort", e);
		        synchronized (this) {
		        	// try again later?
	    			mPendingMessages.add(msg);
		        }
			}
        }
    }


	protected synchronized void sendPendingMessages() {
		while (true) {
			Message msg = null;
			synchronized (this) {
				if (mBound && !mPendingMessages.isEmpty()) 
					msg = mPendingMessages.remove(0);
			}
			if (msg==null)
				break;
			try {
				Log.d(TAG,"Send pending message what="+msg.what);
				mService.send(msg);
			} catch (RemoteException e) {
				Log.w(TAG,"Error sending pending message what="+msg.what);
		        synchronized (this) {
		        	// try again later?
	    			mPendingMessages.add(msg);
		        }
		        break;
			}
		}
	}
	private boolean mIsCaptiveportal = false;
    /**
     * Handler of incoming messages from clients.
     */
    class HotspotHandler extends Handler {
        @Override
        public void handleMessage(Message msg) {
            switch (msg.what) {
                case Hotspot.MSG_REDIRECTED_PORT:
                	Log.i(TAG,"Redirected port "+msg.arg1+" -> "+msg.arg2);
                	if (msg.arg1!=0)
                		port = msg.arg1;
                    break;
                case Hotspot.MSG_INFORM_CAPTIVEPORTAL:
                	Log.i(TAG,"Inform captiveportal "+(msg.arg1!=0));
                	mIsCaptiveportal = msg.arg1!=0;
                	SharedMemory.getInstance().put("captiveportal", Encoding.JSON, msg.arg1!=0 ? "true" : "false");
                	break;
                default:
                    super.handleMessage(msg);
            }
        }
    }

    /**
     * For replies from Hotspot service messages.
     */
    final Messenger mHotspotMessenger = new Messenger(new HotspotHandler());

    /** wifi broadcast handler - update cached network state
     */
	private BroadcastReceiver mWifiReceiver = new BroadcastReceiver() {
		@Override
		public void onReceive(Context context, Intent intent) {
			updateNetworkState();
		}
	};

	private String mHostaddress = "127.0.0.1";
	protected void updateNetworkState() {
		int state = WifiUtils.getWifiState(this);
		if (state==WifiManager.WIFI_STATE_ENABLED || state==WifiUtils.WIFI_AP_STATE_ENABLED) {
			String hostaddress = getHostAddress();
			String ssid = getWifiSsid();
			Log.d(TAG,"updateNetworkState hostaddress="+hostaddress+" ssid="+ssid);
			mHostaddress = hostaddress; 
			try {
				SharedMemory.getInstance().put("hostaddress", hostaddress);
				SharedMemory.getInstance().put("ssid", ssid!=null ? ssid : "");
			} catch (JSONException e1) {
				Log.e(TAG,"Error updating host info in sharedmemory: "+e1, e1);
			}
			JSONObject jo = new JSONObject();
			try {
				jo.put("addr", hostaddress);
				jo.put("if", ssid);
			}
			catch (Exception e) {
				Log.e(TAG,"marshalling networkinterface for recorder", e);
			}
			mRecorder.d("service.host.update", jo);
		} else {
			Log.d(TAG,"updateNetworkState ignored: state="+state);
		}
	}
	public String getCachedHostAddress() {
		return mHostaddress;
	}
	private String getHostAddress() {
		NetworkInterface ni = WifiUtils.getWifiInterface();
		if (ni==null) {
			mRecorder.w("service.host.query.failed", null);
			return "127.0.0.1";
		}
		String ip = WifiUtils.getHostAddress(ni);
		return ip;
	}	
	private String getWifiSsid() {
		JSONObject jo = new JSONObject();
		WifiManager wifiManager = (WifiManager) getSystemService(Context.WIFI_SERVICE);
		int state = wifiManager.getWifiState();
		if (state==WifiManager.WIFI_STATE_ENABLED || state==WifiManager.WIFI_STATE_ENABLING) {
			WifiInfo connectionInfo = wifiManager.getConnectionInfo();
			String ssid = connectionInfo.getSSID();
			// remove quotes (=> UTF-8 encodable)
			if (ssid.startsWith("\"") && ssid.endsWith("\""))
				ssid = ssid.substring(1, ssid.length()-1);
			SupplicantState ss = connectionInfo.getSupplicantState();
			Log.d(TAG,"Wifi is "+ssid+" ("+ss.name()+")"+(state==WifiManager.WIFI_STATE_ENABLING ? " enabling...":""));
			try {
				jo.put("type","client");
				jo.put("ssid", ssid);
				jo.put("name", ss.name());
				jo.put("state", state);
			}
			catch (Exception e) {
				Log.e(TAG,"Error marshalling getWifiSsid info", e);
			}
			mRecorder.i("service.host.wifiSsid.success", jo);
			return ssid;
		}
		else
			Log.d(TAG,"Wifi state="+state);
		// are we a hotspot? need non-documented methods...
		// http://stackoverflow.com/questions/6394599/android-turn-on-off-wifi-hotspot-programmatically
		//wifiControlMethod = mWifiManager.getClass().getMethod("setWifiApEnabled", WifiConfiguration.class,boolean.class);
		int apstate = -1;
		try {
		    Method wifiApConfigurationMethod = wifiManager.getClass().getMethod("getWifiApConfiguration");
			Method wifiApState = wifiManager.getClass().getMethod("getWifiApState");
			apstate = (Integer)wifiApState.invoke(wifiManager);
			//if (apstate==WifiManager.WIFI_STATE_ENABLED || apstate==WifiManager.WIFI_STATE_ENABLING) {
			WifiConfiguration configInfo = (WifiConfiguration)wifiApConfigurationMethod.invoke(wifiManager);
			String ssid = configInfo!=null ? configInfo.SSID : null;
			Log.d(TAG,"WifiAp is "+ssid+" (apstate="+apstate+")");
			// apstate 13 seen when running hotspot...; 11 when not running
			// cf 3 normal wifi enabled?
			if (apstate==13 || apstate==12) {
				try {
					jo.put("type","hotspot");
					jo.put("ssid", ssid);
					jo.put("apstate", apstate);
				}
				catch (Exception e) {
					Log.e(TAG,"Error marshalling getWifiSsid info", e);
				}
				mRecorder.i("service.host.wifiSsid.success", jo);
				return ssid;
			}
		} catch (Exception e) {
			Log.w(TAG,"Unable to find WifiAp methods: "+e);
		}
		try {
			if (apstate>=0)
				jo.put("apstate", apstate);
			jo.put("state", state);
		}
		catch (Exception e) {
			Log.e(TAG,"Error marshalling getWifiSsid error info", e);
		}
		mRecorder.i("service.host.wifiSsid.error", jo);
	    return null;
	}


	// starting service...
	private void handleCommand(Intent intent) {
		Log.d(TAG,"handleCommand "+(intent!=null ? intent.getAction() : "null"));
		onStart();
	}


	// This is the old onStart method that will be called on the pre-2.0
	// platform.  On 2.0 or later we override onStartCommand() so this
	// method will not be called.
	@Override
	public void onStart(Intent intent, int startId) {
	    handleCommand(intent);
	}

	@Override
	public int onStartCommand(Intent intent, int flags, int startId) {
	    handleCommand(intent);
	    // We want this service to continue running until it is explicitly
	    // stopped, so return sticky.
	    return START_STICKY;
	}

	/* (non-Javadoc)
	 * @see android.app.Service#onBind(android.content.Intent)
	 */
	@Override
	public IBinder onBind(Intent arg0) {
		Log.d(TAG,"service onBind => bound");
		onStart();
		mIsBoundTo = true;
		mFinishHandler.removeCallbacks(mCheckFinish);
		return mBinder;
	}
	@Override
	public void onRebind(Intent intent) {
		Log.d(TAG,"service onRebind => bound");
		onStart();
		mIsBoundTo = true;
		mFinishHandler.removeCallbacks(mCheckFinish);
		super.onRebind(intent);
	}

	@Override
	public boolean onUnbind(Intent intent) {
		Log.d(TAG,"service onUnbind => NOT bound");
		mIsBoundTo = false;
		mFinishHandler.removeCallbacks(mCheckFinish);
		mFinishHandler.postDelayed(mCheckFinish, FINISH_DELAY_MS);
		super.onUnbind(intent);
		return true;
	}

	private Handler mFinishHandler = new Handler();
	private Runnable mCheckFinish = new Runnable() {
		@Override
		public void run() {
			SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(Service.this);
			boolean runservice = spref.getBoolean("pref_runservice", false);
			Log.d(TAG,"CheckFinish: mIsBoundTo="+mIsBoundTo+", runservice="+runservice);
			if (mIsBoundTo || runservice)
				return;
			Log.i(TAG,"Finish service (mIsBoundTo="+mIsBoundTo+", runservice="+runservice+")");
			// removes notification!
			onStop();
			Service.this.stopSelf();
		}
	};
	/** Binder subclass (inner class) with methods for local interaction with service */
	public class LocalBinder extends android.os.Binder {
		// local methods... direct access to service
		public Service getService() {
			return Service.this;
		}
	}
	
	public void postRequest(String method, String host, String path, Map<String,String> headers, String requestBody,
			HttpContinuation httpContinuation) throws IOException, HttpError {
		if (!mIsCaptiveportal || hostIsPrimaryServer(host)) {
			if (!"GET".equals(method))
				throw HttpError.badRequest("Unsupported operation ("+method+")");
		
			if (path.startsWith("/a/get?")) 
				GetServer.singleton().handleRequest(this, path, headers, httpContinuation);
			else if (path.equals("/recent") || path.startsWith("/recent?"))
				GetServer.singleton().handleRequestForRecent(this, path, headers, httpContinuation);
			else if (path.equals("/") || path.startsWith("/?"))
				GetServer.singleton().handleRequestForHome(this, path, headers, httpContinuation);
			else if (path.startsWith("/a/"))
				handleAssetRequest(path.substring("/a".length()), headers, requestBody, httpContinuation);
			else if (path.startsWith("/f/"))
				handleFileRequest(path.substring("/f".length()), headers, requestBody, httpContinuation);
			else if (path.startsWith("/qr?"))
				QRCodeServer.handleRequest(path, httpContinuation);
			else if (path.startsWith("/r/")) 
				RedirectServer.singleton().handleRequest(path, httpContinuation);
			else if (path.startsWith("/zero/"))
				handleZeroRequest(path.substring("/zero/".length()), requestBody, httpContinuation);
			else 
				// any other redirects??
				RedirectServer.singleton().handleRequest(path, httpContinuation);
		}
		else {
			if ("GET".equals(method)) {
				// try serving cache content
				File file = CacheServer.singleton().checkCache(this, host, path);
				if (file!=null) {
					sendFile(file, headers, httpContinuation);
					return;
				}
				String cacheBaseurl = CacheServer.singleton().getBaseurl();
				if (cacheBaseurl!=null) {
					String url = "http://"+host+path;
					if (url.startsWith(cacheBaseurl+"get.php?")) {
						Log.i(TAG,"proxy internet get "+url);
						GetServer.singleton().handleRequest(this, path, headers, httpContinuation);
						return;
					}
				}
				// any other redirects??
				RedirectServer rs = RedirectServer.forHostOpt(host);
				if (rs!=null) {
					try {
						rs.handleRequest(path, httpContinuation);
						return;
					}
  					catch (HttpError err) {
  						Log.d(TAG,"Ignoring external redirect error for "+host+" "+path+": "+ err);
  					}
  				}
			}
			throw HttpError.serverError("This is not the internet");
		}
	}
	private void handleZeroRequest(String size, String requestBody,
			HttpContinuation httpContinuation) throws HttpError {
		long length = 0;
		try {
			length = Long.valueOf(size);
		}
		catch (Exception e) {
			throw HttpError.badRequest("invalid size: "+size);
		}
		ZeroInputStream zis = new ZeroInputStream();
		httpContinuation.done(200, "OK", "application/binary", length, zis, null);
	}

	private boolean hostIsPrimaryServer(String host) {
		// ignore port?
		int ix = host.indexOf(":");
		if (ix>=0)
			host = host.substring(0, ix);
		if ("127.0.0.1".equals(host) || "localhost".equals(host))
			return true;
		if (host.equals(mHostaddress))
			return true;
		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(this);
		String hostname = spref.getString("pref_hostname", "leaflets");
		if (hostname.equals(host))
			return true;
		return false;
	}

	private String checkPath(String path) {
		if (path.startsWith("/"))
			path = path.substring(1);
		int qix = path.indexOf("?");
		if (qix>=0)
			path = path.substring(0,qix);
		// guess encoding?!!
		try {
			path = URLDecoder.decode(path, "UTF-8");
		} catch (UnsupportedEncodingException e) {
			Log.e(TAG,"Error decoding URL path "+path, e);
		}
		return path;
	}
	private static Map<String,String> extensionMimeTypes = new HashMap<String,String>();
	public static void registerExtension(String path, String mimeType) {
		int ix = path.lastIndexOf(".");
		String extension = ix>=0 ? path.substring(ix+1) : path;
		if (!extensionMimeTypes.containsKey(extension)) {
			Log.d(TAG,"Register mimetype "+mimeType+" for ."+extension);
			extensionMimeTypes.put(extension, mimeType);
		}
	}
	private String guessMimeType(String path) throws HttpError {
		int ix = path.lastIndexOf('/');
		String mimeType = "application/unknown";
		String filename = path;
		if (ix>=0)
		{
			filename = path.substring(ix+1);
		}
		if (filename.length()==0)
			throw new HttpError(403, "Access denied");
		ix = filename.lastIndexOf(".");
		if (ix>=0) {
			String extension = filename.substring(ix+1).toLowerCase(Locale.US);
			if (extension.equals("html") || extension.equals("htm"))
				mimeType = "text/html";
			else if (extension.equals("xml"))
				mimeType = "text/xml";
			else if (extension.equals("jpg"))
				mimeType = "image/jpg";
			else if (extension.equals("js"))
				mimeType = "text/javascript";
			else if (extension.equals("css"))
				mimeType = "text/css";
			else if (extension.equals("png"))
				mimeType = "image/png";
			else if (extension.equals("gif"))
				mimeType = "image/gif";
			else if (extension.equals("pdf"))
				mimeType = "application/pdf";
			else if (extension.equals("appcache"))
				mimeType = "text/cache-manifest";
			else if (extension.equals("mp3"))
				mimeType = "audio/mpeg";
			else if (extension.equals("mp4"))
				mimeType = "audio/mp4";
			else if (extension.equals("ogg"))
				mimeType = "audio/ogg";
			else if (extension.equals("wav"))
				mimeType = "audio/wav";
			else {
				if (extensionMimeTypes.containsKey(extension))
					mimeType = extensionMimeTypes.get(extension);
				else
					Log.w(TAG,"Unknown file extension "+extension+" (get "+path+")");
			}
		}			
		Log.d(TAG,"Sending "+path+" as "+mimeType);
		return mimeType;
	}
	//@SuppressLint("NewApi")
	private void handleAssetRequest(String path, Map<String,String> requestHeaders, String requestBody,
			HttpContinuation httpContinuation) throws IOException, HttpError {
		path = checkPath(path);
		Map<String,String> headers = new HashMap<String,String>();
		long lastModified = 0;
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.GINGERBREAD)
			try {
				// API level 9
				PackageInfo pi = this.getPackageManager().getPackageInfo("org.opensharingtoolkit.chooser", 0);
				Field f = PackageInfo.class.getField("lastUpdateTime");
				lastModified = f.getLong(pi);
			}catch (Exception e) {
				Log.e(TAG,"Error getting package update time for last modified: "+e, e);
			}
		if (lastModified!=0) {
			HttpUtils.handleNotModifiedSince(requestHeaders, lastModified);
			HttpUtils.setHeaderLastModified(headers, lastModified);
		}
		long expires = System.currentTimeMillis()+CACHE_ASSET_TIME_MS;
		HttpUtils.setHeaderExpires(headers, expires);
	    String mimeType = guessMimeType(path);
		AssetManager assets = getApplicationContext().getAssets();
		// try hard to get asset size
		long length = -1;
		try {
			AssetFileDescriptor afd = assets.openFd(path);
			length = afd.getDeclaredLength();
			if (length==AssetFileDescriptor.UNKNOWN_LENGTH)
				length = -1;
		}
		catch (Exception e) {
			Log.d(TAG,"Anticipated error opening "+path+": "+e.getMessage());
		}
		if (length<0) {
			// try again 
			try {			
				// first, length
				InputStream content = assets.open(path);
				byte buf[] = new byte[10000];
				length = 0;
				while(true) {
					long cnt = content.read(buf);
					if (cnt>0)
						length += cnt;
					else
						break;
				}
				content.close();
			} catch (IOException e) {
				Log.w(TAG,"Error opening asset "+path, e);
			}
		}
		// content
		InputStream content = null;
		try {
			content = assets.open(path);
		} catch (IOException e) {
			Log.w(TAG,"Error opening asset "+path, e);
		}
		if (content!=null) {
			// guess mime type
			httpContinuation.done(200, "OK", mimeType, length, content, headers);
		}
		else {
			Log.d(TAG,"Content not found");
			httpContinuation.done(404, "File not found", "text/plain", 0, null, null);
		}
	}
	private void handleFileRequest(String path, Map<String,String> requestHeaders, String requestBody,
			HttpContinuation httpContinuation) throws IOException, HttpError {
		path = checkPath(path);
		if (path.contains(".."))
			throw new HttpError(403, "Access denied");
			
		File dir = Compat.getExternalFilesDir(this);
		if (dir==null) {
			Log.w(TAG, "handleFileRequest with external storage not available");
			throw new HttpError(404, "File not found");
		}
		File file = new File(dir, path);
		sendFile(file, requestHeaders, httpContinuation);
	}
	public void sendFile(File file,	Map<String,String> requestHeaders, HttpContinuation httpContinuation) throws IOException, HttpError {
		Map<String,String> headers = new HashMap<String,String>();
		long lastModified = 0;
		try {
			lastModified = file.lastModified();
		}
		catch (Exception e) {
			Log.e(TAG,"Error getting file last modified for "+file+": "+e, e);
		}
		if (lastModified!=0) {
			HttpUtils.handleNotModifiedSince(requestHeaders, lastModified);
			HttpUtils.setHeaderLastModified(headers, lastModified);
		}
		long expires = System.currentTimeMillis()+CACHE_FILE_TIME_MS;
		HttpUtils.setHeaderExpires(headers, expires);
		String mimeType = guessMimeType(file.getName());
		// 0 if doesn't exist
		long length = file.length();
		InputStream content = null;
		try {
			content = new FileInputStream(file);
		}
		catch (IOException e) {
			Log.d(TAG,"File not found: "+file);
			throw new HttpError(403,"File not found");
		}
		httpContinuation.done(200, "OK", mimeType, length, content, headers);
	}

	@Override
	public void onSharedPreferenceChanged(SharedPreferences sharedPreferences,
			String key) {
		if ("pref_runservice".equals(key)) {
			boolean runservice = sharedPreferences.getBoolean("pref_runservice", false);
			// TODO Auto-generated method stub
			Log.d(TAG,"service pref_runservice changed to "+runservice);
			mFinishHandler.removeCallbacks(mCheckFinish);
			if (!runservice)
				mFinishHandler.postDelayed(mCheckFinish, FINISH_DELAY_MS);
		}
	}
	
}
