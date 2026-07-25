<%@page contentType="text/html;charset=UTF-8"%>
<%@page import="org.apache.commons.codec.binary.Base64"%>
<%@page import="java.security.MessageDigest"%>
<%@page import="java.util.Locale"%>
<%@page import="java.util.Map"%>
<%@page import="java.util.Map.Entry"%>
<%@page import="java.util.Set"%>
<%@page import="java.util.SortedMap"%>
<%@page import="java.util.TreeMap"%>
<%@page import="java.util.Vector"%>
<%@page import="java.util.List"%>
<%@page import="java.util.Comparator"%>
<%@page import="java.net.URLDecoder"%>
<%@page import="java.net.URLEncoder"%>
<%@page import="java.io.*"%>
<%
		
			String storeKey = "TEST1234";
			
			
			
			request.setCharacterEncoding("UTF-8");
		    // create sorted map
		    SortedMap<String, String> allRequestParams = new TreeMap<String, String>(new Comparator<String>() {
		        public int compare(String str1, String str2) {
		            str1 = str1.toUpperCase(Locale.US);
		            str2 = str2.toUpperCase(Locale.US);
		            return str1.compareTo(str2);
		        }
		    });
		    // get all paramater map
		    Map<String, String[]> parameterMap = request.getParameterMap();
		    Set<String> requestParams = parameterMap.keySet();
		    for (String requestParam : requestParams) {
		        String[] allRequestParamValues = parameterMap.get(requestParam);
		        if (allRequestParamValues != null && allRequestParamValues.length > 0) {
		            String value = allRequestParamValues[0];
		            allRequestParams.put(requestParam, value);

		    }
		    }
		    // init hash value 
		    String hashval3 = "";
		    for (String requestParam : allRequestParams.keySet()) {
		        String lowerParam = requestParam.toLowerCase(Locale.US);
		        if (!lowerParam.equals("encoding") && !lowerParam.equals("hash")) {
		            hashval3 += request.getParameter(URLDecoder.decode(requestParam, "UTF-8")).replace("\\", "\\\\").replace("|", "\\|").replaceAll("[\\t\\n\\r]+","") + "|";
		        }
		    }
		    storeKey = storeKey.replace("\\", "\\\\").replace("|", "\\|");
		    hashval3 += storeKey;

		    MessageDigest messageDigest = MessageDigest.getInstance("SHA-512");
		    messageDigest.update(hashval3.getBytes("UTF-8"));
		    String actualHash = new String(Base64.encodeBase64(messageDigest.digest()), "UTF-8");
		    String retrievedHash = request.getParameter("HASH");
		    String procReturnCode = request.getParameter("ProcReturnCode");
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
		    if(actualHash.equals(retrievedHash)){
				if(procReturnCode.equals("00")){
%>
ACTION=POSTAUTH
<%
				} else { 
%>
APPROVED
<%
				} 
			} else { 
%>
FAILURE
<%
			} 
/*
	The callback request sent by CMI platform to the merchant’s web site in server-to-server mode, reminds as well of the cases of successful transactions as cases of rejections. 
	So it may well be that the merchant’s web site receives, for the same transaction (same order number), rejection returns that will be followed by a return of transaction acceptance. 
	This means that the client has failed attempts before it succeeds. 
	It is the parameter ProcReturnCode which makes possible to distinguish between the callback request of a successful payment authorization (ProcReturnCode = 00) and the callback request of a failed payment (ProcReturnCode! = 00 or nonexistent).
*/
%>