package org.opensharingtoolkit.kiosk;

import android.os.Bundle;
import android.app.Activity;
import android.util.Log;
import android.view.Menu;

public class MainActivity extends Activity {

    private static final String TAG = "kiosk";


	@Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }


    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
    	// actually, there should never be a menu in the kiosk
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.main, menu);
        return true;
    }


	@Override
	public void onBackPressed() {
		// no-op
		Log.w(TAG,"ignoring Back");
	}    
    
}
