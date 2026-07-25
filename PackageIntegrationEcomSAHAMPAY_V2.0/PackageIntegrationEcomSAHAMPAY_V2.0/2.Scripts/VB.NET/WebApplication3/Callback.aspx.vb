Imports System.Configuration
Imports System.Web
Imports System.Web.Security
Imports System.Web.UI
Imports System.Web.UI.WebControls
Imports System.Web.UI.WebControls.WebParts
Imports System.Web.UI.HtmlControls
Imports System.Security.Cryptography
Imports System.Text
Imports System.Drawing
Imports System.Net

Public Class Callback
    Inherits System.Web.UI.Page

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        Try
            Dim storekey As String = ConfigurationManager.AppSettings("storekey")

            Dim sortedList As New SortedList()

            For Each paramName As String In Request.Form.AllKeys
                sortedList.Add(paramName, Request.Form(paramName))
            Next

            Dim hashval As String = ""

            Dim i As Integer
            For i = 0 To sortedList.Count - 1
                Dim lowerKey As String = sortedList.GetKey(i).ToString.ToLower()
                If (Not lowerKey.Equals("hash") And Not lowerKey.Equals("encoding")) Then
                    hashval += WebUtility.HtmlDecode(sortedList.GetByIndex(i).Replace("\\", "\\\\").Replace("|", "\\|").Replace("\n", "").Replace("\r", "").Trim()) + "|"
                End If
            Next i



            storekey = storekey.Replace("\", "\\").Replace("|", "\|")
            hashval += storekey

            Dim actualHash As String = Request.Form("HASH")
            Dim retrievedHash As String = Generatehash512(hashval)
            Dim ProcReturnCode As String = Request.Form("ProcReturnCode")

            If (retrievedHash.Equals(actualHash)) Then
                If (ProcReturnCode.Equals("00")) Then
                    Response.Write("ACTION=POSTAUTH")
                Else
                    Response.Write("APPROVED")
                End If
            Else
                Response.Write("FAILURE")
            End If
        Catch ex As Exception

        End Try
    End Sub

    Public Function Generatehash512(ByVal text As String) As String

        Dim message As Byte() = Encoding.UTF8.GetBytes(text)

        Dim UE As New UnicodeEncoding()
        Dim hashValue As Byte()
        Dim hashString As New SHA512Managed()
        Dim hex As String = ""
        hashValue = hashString.ComputeHash(message)
        Dim hash As String = Convert.ToBase64String(hashValue)
        Return hash

    End Function






End Class