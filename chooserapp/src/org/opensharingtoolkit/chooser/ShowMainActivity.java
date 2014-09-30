/**
 * 
 */
package org.opensharingtoolkit.chooser;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;

/**
 * @author pszcmg
 *
 */
public class ShowMainActivity extends Activity {

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		// TODO Auto-generated method stub
		super.onCreate(savedInstanceState);
	}

	@Override
	protected void onResume() {
		super.onResume();
		Intent i = new Intent(this, MainActivity.class);
		startActivity(i);
		this.finish();
	}

}
