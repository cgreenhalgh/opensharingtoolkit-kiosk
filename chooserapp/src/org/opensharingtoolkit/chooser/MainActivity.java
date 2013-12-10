package org.opensharingtoolkit.chooser;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

public class MainActivity extends BrowserActivity {

	
	
	@Override
	@SuppressLint("SetJavaScriptEnabled")
	protected void onCreate(Bundle savedInstanceState) {
		// make sure service is running...
		startService(new Intent(getApplicationContext(), Service.class));
		
		// TODO Auto-generated method stub
		super.onCreate(savedInstanceState);		
	}

	@Override
	protected boolean handleBackPressed() {
		if (!super.handleBackPressed())
			// always 'handled'?? leave to kiosk??
			Log.w(TAG,"ignoring Back");
		return true;
	}
}
