using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace CmiPay
{
    public partial class Callback : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            try
            {

                String storeKey = ConfigurationManager.AppSettings["storeKey"];
                string actualHash = string.Empty;
                string retrievedHash = string.Empty;

                List<KeyValuePair<String, String>> postParams = new List<KeyValuePair<String, String>>();
                List<String> ExcludedhashParams = new List<String>();
                ExcludedhashParams.Add("encoding");
                ExcludedhashParams.Add("HASH");
                bool inListHash = true;
                foreach (string key in Request.Form.AllKeys)
                {
                    inListHash = ExcludedhashParams.Contains(key);
                    if (!inListHash)
                    {
                        KeyValuePair<String, String> newKeyValuePair = new KeyValuePair<String, String>(key, Request.Form[key]);
                        postParams.Add(newKeyValuePair);
                    }

                }
                postParams.Sort(
         delegate (KeyValuePair<string, string> firstPair,
         KeyValuePair<string, string> nextPair)
         {
             return firstPair.Key.CompareTo(nextPair.Key.ToLower(new System.Globalization.CultureInfo("en-US", false)));
         }
     );
                String hashVal = "";
                storeKey = storeKey.Replace("\\", "\\\\").Replace("|", "\\|");

                foreach (KeyValuePair<String, String> pair in postParams)
                {
                    String escapedValue = pair.Value.Replace("\\", "\\\\").Replace("|", "\\|").Replace("\n", "").Replace("\r", "").Trim();
                    String lowerValue = pair.Key.ToLower(new System.Globalization.CultureInfo("en-US", false));
                    hashVal += escapedValue + "|";
                }
                hashVal += storeKey;
                actualHash = Request.Form["HASH"];
                retrievedHash = Generatehash512(hashVal);         //generating hash
                /*
	                During the callback request, the merchant’s web site is supposed to do the following:
		                •	Generate a hash code with the same data posted by the CMI platform in the callback request. Then compare this calculated hash with the hash sent by the CMI platform in the callback request. If they are identical, proceed to the next check.
		                •	Look, in the orders’ DB of the merchant’s web site, for the record identified by the value of the "oid" parameter sent by the CMI platform in the callback request.
		                •	Check if the amount of the order recorded in the orders’ DB of the merchant’s web site is equal to the amount sent by the CMI in the callback request via the "amount" parameter.
		                •	Check the "ProcReturnCode" parameter value sent by the CMI in the callback request:
			                o	If ProcReturnCode = 00, this is an accepted transaction.
				                	So it is necessary to update the status of the order in the orders’ DB of the merchant’s web site (status = Paid).
				                	Answer the CMI callback request with: 
					                •	"ACTION=POSTAUTH": in order to debit the client automatically.
					                •	"APPROVED": in order to not debit the client automatically. In this case, the merchant needs to manage capture or void manually via CMI Merchant Center interface.
			                o	If the ProcReturnCode <> 00 or if ProcReturnCode parameter does not exist in the callback request, it is a payment authorization failure.
				                	In this case, do not change the status of the order in the BDD orders of the merchant’s web site.
				                	The response to return to the CMI callback request is "APPROVED" (acknowledgment).
		                •	If a technical problem occurs in one of the previous steps, answer the CMI callback request with "FAILURE". In this case, the merchant needs to manage capture or void manually via CMI Merchant Center interface.
                */

                if (retrievedHash != actualHash)
                {
                    //Value didn't match that means some paramter value change between transaction 
                    Response.Write("FAILURE");

                }
                else
                {
                    if (Request.Form["ProcReturnCode"] == "00")
                    {


                        Response.Write("ACTION=POSTAUTH");


                    }
                    else
                    {

                        Response.Write("APPROVED");

                    }

                }
                /*
	                The callback request sent by CMI platform to the merchant’s web site in server-to-server mode, reminds as well of the cases of successful transactions as cases of rejections. 
	                So it may well be that the merchant’s web site receives, for the same transaction (same order number), rejection returns that will be followed by a return of transaction acceptance. 
	                This means that the client has failed attempts before it succeeds. 
	                It is the parameter ProcReturnCode which makes possible to distinguish between the callback request of a successful payment authorization (ProcReturnCode = 00) and the callback request of a failed payment (ProcReturnCode! = 00 or nonexistent).
                */

            }

            catch (Exception ex)
            {
                Response.Write(ex.Message);

            }
        }
        /// <summary>
        /// Generate HASH for encrypt all parameter passing while transaction
        /// </summary>
        /// <param name="text"></param>
        /// <returns></returns>
        public string Generatehash512(string text)
        {

            byte[] message = Encoding.UTF8.GetBytes(text);

            UnicodeEncoding UE = new UnicodeEncoding();
            byte[] hashValue;
            SHA512Managed hashString = new SHA512Managed();
            hashValue = hashString.ComputeHash(message);
            String hash = System.Convert.ToBase64String(hashValue);
            return hash;

    }

}
}