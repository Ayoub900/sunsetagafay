<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="PaymentRequest.aspx.cs" Inherits="CmiPay.PaymentRequest" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml" >
<head id="Head1" runat="server">
    <title>Payment Request</title>
    
    
 


</head>
<body >
    <form id="form1" runat="server" method="post">
    
    <div id ="frmError" runat="server">
      <span style="color:red">Please fill all mandatory fields.</span>
      <br/>
      <br/>
      </div>
      
            <input type="hidden"  runat="server" id="clientid" name="clientid" />
            <input type="hidden"  runat="server" id="okUrl" name="okUrl" />
            <input type="hidden"  runat="server" id="failUrl" name="failUrl" />
			<input type="hidden"  runat="server" id="shopurl" name="shopurl" />
            <input type="hidden"  runat="server" id="callbackUrl" name="callbackUrl" />
            <input type="hidden"  runat="server" id="TranType" name="TranType" value="PreAuth" />
            <input type="hidden"  runat="server" id="currency" name="currency" value="504" />
            <input type="hidden"  runat="server" id="rnd" name="rnd"/>
            <input type="hidden"  runat="server" id="storetype" name="storetype" value="3D_PAY_HOSTING" />
            <input type="hidden"  runat="server" id="lang" name="lang" value="fr" />
            <input type="hidden"  runat="server" id="hashAlgorithm" name="hashAlgorithm" value="ver3" />
            <input type="hidden"  runat="server" id="refreshtime" name="refreshtime" value="5" />
			<input type="hidden"  runat="server" id="encoding" name="encoding" value="UTF-8" />
            <input type="hidden" runat="server" id="hash" name="hash"  />
            <input type="hidden" runat="server" id="oid" name="oid" />
      <table>
       <tr>
          <td>Amount * : </td>
          <td>
          <input type="text" ID="amount" name="amount" runat="server"  value="10,50" /></td>
          <td>Customer Name * : </td>
          <td>
           <input type="text"  ID="BillToName" name="BillToName" runat="server"   value="Name"/></td>
        </tr>
        <tr>
          <td>Email * : </td>
          <td>
           <input type="text"  ID="email" runat="server"  value="email@domaine.com"/></td>
          <td>Phone: </td>
          <td>
          <input type="text"  ID="tel" runat="server"   value="0655447788"/></td>
        </tr>
        <tr>
          <td>Company: </td>
          <td>
          <input type="text"  ID="BillToCompany" runat="server"  value="BillToCompany"/></td>
          <td>BillToStreet1: </td>
          <td>
          <input type="text"  ID="BillToStreet1" runat="server"  value="100 rue adress"/></td>
        </tr>
        <tr>
          <td>BillToCity: </td>
          <td colspan="3">
         <input type="text"  ID="BillToCity" runat="server"  value="casablanca"/></td>
        </tr>
        <tr>
          <td>BillToStateProv: </td>
          <td colspan="3">
          <input type="text"  ID="BillToStateProv" runat="server"  value="Maarif Casablanca"/></td>
        </tr>
        <tr>
          <td>BillToPostalCode: </td>
          <td colspan="3">
          <input type="text"  ID="BillToPostalCode" runat="server"  value="20200"/></td>
        </tr>
        <tr>
          <td>BillToCountry: </td>
          <td>
          <input type="text"  ID="BillToCountry" runat="server"  value="504" />
          </td>
         </tr>        
        <tr>
        
            <td colspan="4"></td>
            
        </tr>
      </table>
     <br />
      <asp:Button ID="submit" Text="submit" Width="100px"  runat="server" OnClick="Button1_Click"  />
    </form>
</body>
</html>
