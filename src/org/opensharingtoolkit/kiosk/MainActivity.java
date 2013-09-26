package org.opensharingtoolkit.kiosk;

import android.util.Log;

public class MainActivity extends BrowserActivity {

	@Override
	public void onBackPressed() {
		// no-op
		Log.w(TAG,"ignoring Back");
	}    
    
}
