/**
 * 
 */
package org.opensharingtoolkit.kiosk;

import org.opensharingtoolkit.kiosk.R;

import android.os.Bundle;
import android.preference.PreferenceActivity;

/**
 * @author pszcmg
 *
 */
public class SettingsActivity extends PreferenceActivity {

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		addPreferencesFromResource(R.xml.preferences);
	}

}
