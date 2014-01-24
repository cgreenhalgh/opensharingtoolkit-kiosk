package org.opensharingtoolkit.hotspot;

import android.os.Bundle;
import android.os.IBinder;
import android.os.Messenger;
import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.util.Log;
import android.view.Menu;

public class MainActivity extends Activity {

	private static final String TAG = "ost-hotspot";

    /** Messenger for communicating with the Hotspot service. */
    private Messenger mService = null;
    /** Flag indicating whether we have called bind on the service. */
    private boolean mBound;

    @Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_main);
		// bind the hotspot service
		// (Could be simpler as a local interaction)
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
 	}

	/* (non-Javadoc)
	 * @see android.app.Activity#onDestroy()
	 */
	@Override
	protected void onDestroy() {
		super.onDestroy();
		// Unbind from the Hotspot service
        if (mBound) {
            unbindService(mConnection);
            mBound = false;
        }
	}
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
            synchronized (MainActivity.this) {
            	mBound = true;
            }
        }

        public void onServiceDisconnected(ComponentName className) {
            // This is called when the connection with the service has been
            // unexpectedly disconnected -- that is, its process crashed.
            mService = null;
            mBound = false;
            Log.d(TAG,"HotspotService disconnected");
        }
    };

 
	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.main, menu);
		return true;
	}

	@Override
	protected void onResume() {
		super.onResume();
		//Log.d(TAG,"Starting service...");
		//Intent service = new Intent(this, HotspotService.class);
		//startService(service);
	}

}
