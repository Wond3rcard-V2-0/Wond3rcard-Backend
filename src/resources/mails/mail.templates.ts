const MailTemplates = {
    welcomeTemplate: /*html*/ `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to WOND3R CARD</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
        }
        .wrapper {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .container {
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(109, 65, 202, 0.08);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #6d41ca 0%, #8b5cf6 100%);
            padding: 32px 24px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .content {
            padding: 40px 32px;
            text-align: center;
        }
        h2 {
            color: #1a1a2e;
            font-size: 24px;
            margin: 0 0 16px 0;
            font-weight: 600;
        }
        p {
            font-size: 16px;
            color: #4a5568;
            line-height: 1.7;
            margin: 0 0 16px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #6d41ca 0%, #8b5cf6 100%);
            color: #ffffff;
            padding: 14px 32px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 8px;
            margin-top: 24px;
            transition: transform 0.2s ease;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 24px 32px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            font-size: 14px;
            color: #718096;
            margin: 0 0 8px 0;
        }
        .footer a {
            color: #6d41ca;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>WOND3R CARD</h1>
            </div>
            <div class="content">
                <h2>Welcome, {{userName}}!</h2>
                <p>Thank you for signing up! We're thrilled to have you on board.</p>
                <p>Start exploring all the benefits of WOND3R CARD and enjoy an amazing experience.</p>
                <a href="{{dashboardLink}}" class="cta-button">Go to Dashboard</a>
            </div>
            <div class="footer">
                <p>If you have any questions, feel free to <a href="mailto:support@wond3rcard.com">contact us</a>.</p>
                <p>— The WOND3R CARD Team</p>
            </div>
        </div>
    </div>
</body>
</html>
`,

    subscriptionConfirmation: /*html*/ `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Confirmed</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
        }
        .wrapper {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .container {
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(109, 65, 202, 0.08);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #6d41ca 0%, #8b5cf6 100%);
            padding: 32px 24px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .success-badge {
            display: inline-block;
            background-color: rgba(255,255,255,0.2);
            color: #ffffff;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            margin-top: 12px;
        }
        .content {
            padding: 40px 32px;
        }
        h2 {
            color: #1a1a2e;
            font-size: 24px;
            margin: 0 0 8px 0;
            font-weight: 600;
            text-align: center;
        }
        .subtitle {
            color: #6d41ca;
            font-size: 16px;
            text-align: center;
            margin: 0 0 32px 0;
        }
        p {
            font-size: 16px;
            color: #4a5568;
            line-height: 1.7;
            margin: 0 0 16px 0;
        }
        .order-details {
            background-color: #f8f9fa;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
        }
        .order-details h3 {
            color: #1a1a2e;
            font-size: 16px;
            margin: 0 0 16px 0;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #718096;
            font-size: 14px;
        }
        .detail-value {
            color: #1a1a2e;
            font-size: 14px;
            font-weight: 600;
        }
        .total-row {
            background-color: #6d41ca;
            color: #ffffff;
            margin: 16px -24px -24px -24px;
            padding: 16px 24px;
            border-radius: 0 0 12px 12px;
            display: flex;
            justify-content: space-between;
        }
        .total-label {
            font-size: 16px;
            font-weight: 600;
        }
        .total-value {
            font-size: 18px;
            font-weight: 700;
        }
        .cta-button {
            display: block;
            background: linear-gradient(135deg, #6d41ca 0%, #8b5cf6 100%);
            color: #ffffff;
            padding: 16px 32px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 8px;
            margin: 32px auto 0;
            text-align: center;
            max-width: 280px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 24px 32px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            font-size: 14px;
            color: #718096;
            margin: 0 0 8px 0;
        }
        .footer a {
            color: #6d41ca;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>WOND3R CARD</h1>
                <span class="success-badge">✓ Payment Successful</span>
            </div>
            <div class="content">
                <h2>Thank you, {{name}}!</h2>
                <p class="subtitle">Your subscription is now active</p>
                
                <p>We're excited to have you on board. Your subscription has been successfully activated and you now have full access to all {{plan}} features.</p>
                
                <div class="order-details">
                    <h3>Subscription Details</h3>
                    <div class="detail-row">
                        <span class="detail-label">Plan</span>
                        <span class="detail-value">{{plan}}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Billing Cycle</span>
                        <span class="detail-value">{{billingCycle}}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Start Date</span>
                        <span class="detail-value">{{startDate}}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Next Billing Date</span>
                        <span class="detail-value">{{expiresAt}}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Payment Method</span>
                        <span class="detail-value">{{paymentMethod}}</span>
                    </div>
                    <div class="total-row">
                        <span class="total-label">Amount Paid</span>
                        <span class="total-value">{{amount}}</span>
                    </div>
                </div>
                
                <a href="{{dashboardLink}}" class="cta-button">Go to Dashboard</a>
            </div>
            <div class="footer">
                <p>If you have any questions, feel free to <a href="mailto:support@wond3rcard.com">contact us</a>.</p>
                <p>— The WOND3R CARD Team</p>
            </div>
        </div>
    </div>
</body>
</html>
`,

    subscriptionCancelled: /*html*/ `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Cancelled</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
        }
        .wrapper {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .container {
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(109, 65, 202, 0.08);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #6d41ca 0%, #8b5cf6 100%);
            padding: 32px 24px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .content {
            padding: 40px 32px;
        }
        h2 {
            color: #1a1a2e;
            font-size: 24px;
            margin: 0 0 8px 0;
            font-weight: 600;
            text-align: center;
        }
        .subtitle {
            color: #e53e3e;
            font-size: 16px;
            text-align: center;
            margin: 0 0 32px 0;
        }
        p {
            font-size: 16px;
            color: #4a5568;
            line-height: 1.7;
            margin: 0 0 16px 0;
        }
        .cancellation-details {
            background-color: #fff5f5;
            border: 1px solid #fed7d7;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
        }
        .cancellation-details h3 {
            color: #c53030;
            font-size: 16px;
            margin: 0 0 16px 0;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #fed7d7;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #718096;
            font-size: 14px;
        }
        .detail-value {
            color: #1a1a2e;
            font-size: 14px;
            font-weight: 600;
        }
        .access-notice {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 12px;
            padding: 20px 24px;
            margin: 24px 0;
        }
        .access-notice p {
            color: #166534;
            margin: 0;
            font-size: 15px;
        }
        .access-notice strong {
            color: #15803d;
        }
        .cta-button {
            display: block;
            background: linear-gradient(135deg, #6d41ca 0%, #8b5cf6 100%);
            color: #ffffff;
            padding: 16px 32px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 8px;
            margin: 32px auto 0;
            text-align: center;
            max-width: 280px;
        }
        .resubscribe-note {
            text-align: center;
            margin-top: 24px;
            padding: 20px;
            background-color: #faf5ff;
            border-radius: 12px;
        }
        .resubscribe-note p {
            margin: 0;
            color: #553c9a;
            font-size: 15px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 24px 32px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            font-size: 14px;
            color: #718096;
            margin: 0 0 8px 0;
        }
        .footer a {
            color: #6d41ca;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>WOND3R CARD</h1>
            </div>
            <div class="content">
                <h2>Hi {{name}},</h2>
                <p class="subtitle">Your subscription has been cancelled</p>
                
                <p>We're sorry to see you go. Your subscription cancellation has been processed successfully.</p>
                
                <div class="cancellation-details">
                    <h3>Cancellation Details</h3>
                    <div class="detail-row">
                        <span class="detail-label">Plan</span>
                        <span class="detail-value">{{plan}}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Cancellation Date</span>
                        <span class="detail-value">{{cancelledDate}}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Access Until</span>
                        <span class="detail-value">{{accessUntil}}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status</span>
                        <span class="detail-value">Cancelled</span>
                    </div>
                </div>
                
                <div class="access-notice">
                    <p><strong>Good news!</strong> You'll continue to have access to all your {{plan}} features until <strong>{{accessUntil}}</strong>.</p>
                </div>
                
                <div class="resubscribe-note">
                    <p>Changed your mind? You can resubscribe anytime to continue enjoying WOND3R CARD's premium features.</p>
                </div>
                
                <a href="{{dashboardLink}}" class="cta-button">Manage Your Account</a>
            </div>
            <div class="footer">
                <p>Need help? Reach out to us anytime at <a href="mailto:support@wond3rcard.com">support@wond3rcard.com</a>.</p>
                <p>— The WOND3R CARD Team</p>
            </div>
        </div>
    </div>
</body>
</html>
`,

    physicalCardOrderConfirmation: /*html*/ `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Card Order Successful!</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
        }
        .wrapper {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .container {
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(109, 65, 202, 0.08);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #6d41ca 0%, #8b5cf6 100%);
            padding: 32px 24px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .content {
            padding: 40px 32px;
            text-align: center;
        }
        h2 {
            color: #1a1a2e;
            font-size: 24px;
            margin: 0 0 16px 0;
            font-weight: 600;
        }
        p {
            font-size: 16px;
            color: #4a5568;
            line-height: 1.7;
            margin: 0 0 16px 0;
        }
        .order-details {
            background-color: #f8f9fa;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            text-align: left;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #718096;
            font-size: 14px;
        }
        .detail-value {
            color: #1a1a2e;
            font-size: 14px;
            font-weight: 600;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 24px 32px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            font-size: 14px;
            color: #718096;
            margin: 0 0 8px 0;
        }
        .footer a {
            color: #6d41ca;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>WOND3R CARD</h1>
            </div>
            <div class="content">
                <h2>Thank You for Your Order, {{emailData.name}}!</h2>
                <p>Your physical card order has been successfully placed.</p>
                <div class="order-details">
                    <div class="detail-row">
                        <span class="detail-label">Order ID</span>
                        <span class="detail-value">{{emailData.orderId}}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Shipping Address</span>
                        <span class="detail-value">{{emailData.address}}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Estimated Delivery</span>
                        <span class="detail-value">{{emailData.estimatedDelivery}}</span>
                    </div>
                </div>
            </div>
            <div class="footer">
                <p>If you have any questions, feel free to <a href="mailto:support@wond3rcard.com">contact us</a>.</p>
                <p>— The WOND3R CARD Team</p>
            </div>
        </div>
    </div>
</body>
</html>`,

    setup2faConfirmation: /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>2FA Setup Confirmation</title>
</head>
<body>
  <h2>Hello, {{userName}}!</h2>
  <p>You have successfully enabled Two-Factor Authentication (2FA) for your account.</p>
  <p>If you didn’t perform this action, please contact our support team immediately.</p>
</body>
</html>
`,

    setupmfaConfrimation: /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MFA Setup Successful</title>
</head>
<body>
  <h2>Hello, {{userName}}!</h2>
  <p>You’ve successfully set up Multi-Factor Authentication (MFA) on your account.</p>
  <p>If this wasn’t you, please contact support immediately.</p>
</body>
</html>
`,
    passwordResetRequest: /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Password Reset Request</title>
</head>
<body>
  <h2>Hello, {{userName}}!</h2>
  <p>We received a request to reset your password.</p>
  <p>Your OTP code is:</p>
  <h3>{{otpCode}}</h3>
  <p><a href="{{resetPasswordLink}}">Or click here to reset your password</a>.</p>
  <p>If you didn’t request a password reset, please ignore this email or contact support.</p>
</body>
</html>
`,

    otpVerification: /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Your OTP Code</title>
</head>
<body>
  <h2>Hello, {{userName}}!</h2>
  <p>Your OTP code is:</p>
  <h3>{{otpCode}}</h3>
  <p>This code is valid for 10 minutes.</p>
  <p>or click the link below to verify your account:</p>
  <a href="{{verifyLink}}">Verify Account</a>
  <p>If you didn't request this code, please ignore this email.</p>
</body>
</html>
`,

    welcomeWithOtp: /*html*/ `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to WOND3R CARD</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
        }
        .wrapper {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .container {
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(109, 65, 202, 0.08);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #6d41ca 0%, #8b5cf6 100%);
            padding: 32px 24px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .content {
            padding: 40px 32px;
            text-align: center;
        }
        h2 {
            color: #1a1a2e;
            font-size: 24px;
            margin: 0 0 16px 0;
            font-weight: 600;
        }
        p {
            font-size: 16px;
            color: #4a5568;
            line-height: 1.7;
            margin: 0 0 16px 0;
        }
        .otp-container {
            background-color: #f8f9fa;
            border: 2px dashed #6d41ca;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
        }
        .otp-label {
            font-size: 14px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0 0 8px 0;
        }
        .otp-code {
            font-size: 32px;
            font-weight: 700;
            color: #6d41ca;
            letter-spacing: 6px;
            margin: 0;
        }
        .otp-expiry {
            font-size: 13px;
            color: #a0aec0;
            margin: 12px 0 0 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 24px 32px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            font-size: 14px;
            color: #718096;
            margin: 0 0 8px 0;
        }
        .footer a {
            color: #6d41ca;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>WOND3R CARD</h1>
            </div>
            <div class="content">
                <h2>Welcome, {{userName}}!</h2>
                <p>Thank you for signing up! We're thrilled to have you on board.</p>
                <p>To get started, please verify your account using the code below:</p>
                <div class="otp-container">
                    <p class="otp-label">Your Verification Code</p>
                    <p class="otp-code">{{otpCode}}</p>
                    <p class="otp-expiry">This code is valid for 60 minutes</p>
                </div>
                <p>Start exploring all the benefits of WOND3R CARD and enjoy an amazing experience.</p>
            </div>
            <div class="footer">
                <p>If you didn't create this account, please ignore this email.</p>
                <p>If you have any questions, feel free to <a href="mailto:support@wond3rcard.com">contact us</a>.</p>
                <p>— The WOND3R CARD Team</p>
            </div>
        </div>
    </div>
</body>
</html>
`,

    signUpWelcome: /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome to Our Platform!</title>
</head>
<body>
  <h2>Welcome, {{userName}}!</h2>
  <p>Thank you for signing up. We’re thrilled to have you on board!</p>
  <p><a href="{{verifyLink}}">Verify your email address</a> to start using your account.</p>
  <p>If you have any questions, feel free to reach out to our support team.</p>
</body>
</html>
`,
    signInNotification: /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sign In Notification</title>
</head>
<body>
  <h2>Hello, {{userName}}!</h2>
  <p>We noticed a new sign-in to your account on {{date}} from {{location}}.</p>
  <p>If this was you, no further action is required.</p>
  <p>If this wasn’t you, please <a href="{{resetPasswordLink}}">reset your password</a> immediately.</p>
</body>
</html>
`,

    accountAlreadyVerified: /*html*/ `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Verified</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: auto; }
        h1 { color: #6d41ca; }
        p { color: #333; }
        .btn { display: inline-block; padding: 10px 20px; margin-top: 20px; text-decoration: none; color: white; background-color: #6d41ca; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Account Verified Successfully!</h1>
        <p>Thank you for verifying your account, {{userEmail}}. You can now log in and access your account.</p>
        <a href="{{loginUrl}}" class="btn">Log In</a>
    </div>
</body>
</html>
`,

    passwordChangedSuccessfully: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Password Changed Successfully</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    h2 {
      color: #6d41ca;
    }
    p {
      margin: 10px 0;
    }
    a {
      color: #6d41ca;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h2>Hello, {{userName}}!</h2>
  <p>This is to confirm that your password was changed successfully.</p>
  <p>If you made this change, you can safely ignore this email.</p>
  <p>If you did not request this change, please contact our support team immediately to secure your account.</p>
  <p>Thank you for using our service!</p>
  <p>
    Best regards, <br>
    The {{companyName}} Team
  </p>
  <p>
    <small>If you need further assistance, <a href="{{supportLink}}">contact support</a>.</small>
  </p>
</body>
</html>
`,

    accountVerified: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Account Verified Successfully</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    h2 {
      color: #6d41ca;
    }
    p {
      margin: 10px 0;
    }
    a {
      color: #6d41ca;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h2>Hello, {{userName}}!</h2>
  <p>We are pleased to inform you that your account has been successfully verified.</p>
  <p>You can now log in and enjoy all the features of our service.</p>
  <p>If you did not initiate this verification, please contact our support team immediately to secure your account.</p>
  <p>Thank you for choosing {{companyName}}!</p>
  <p>
    Best regards, <br>
    The {{companyName}} Team
  </p>
  <p>
    <small>If you need further assistance, <a href="{{supportLink}}">contact support</a>.</small>
  </p>
</body>
</html>
`,
    githubMailMergeNotification: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Merge Event Notification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f9;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: #6d41ca;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 20px;
    }
    .content p {
      font-size: 16px;
      color: #333333;
      margin: 8px 0;
    }
    .content .label {
      font-weight: bold;
      color: #555555;
    }
    .footer {
      background-color: #eeeeee;
      text-align: center;
      padding: 10px;
      font-size: 14px;
      color: #777777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Merge Event Notification</h1>
    </div>
    <div class="content">
      <p><span class="label">Repository:</span> {{repository}}</p>
      <p><span class="label">Branch:</span>  {{branch}}</p>
      <p><span class="label">Committer:</span>  {{commiter}}</p>
      <p><span class="label">Commit Message:</span>  {{commit}}</p>
      <p><span class="label">Merge Event:</span> {{event}}</p>
    </div>
    <div class="footer">
      <p>This is an automated notification. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`,

    request2FA: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enable 2FA - OTP Code</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
        }
        .wrapper {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .email-container {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(109, 65, 202, 0.08);
            overflow: hidden;
        }
        .email-header {
            background: linear-gradient(135deg, #6d41ca 0%, #8b5cf6 100%);
            color: #ffffff;
            padding: 32px 24px;
            text-align: center;
            font-size: 28px;
            font-weight: 700;
        }
        .email-body {
            padding: 40px 32px;
            line-height: 1.7;
            color: #4a5568;
        }
        .email-body p {
            margin: 16px 0;
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            background: #faf5ff;
            padding: 20px;
            margin: 24px 0;
            border: 2px dashed #6d41ca;
            border-radius: 12px;
            color: #6d41ca;
            letter-spacing: 4px;
        }
        .email-footer {
            background: #f8f9fa;
            text-align: center;
            padding: 24px 32px;
            font-size: 14px;
            color: #718096;
            border-top: 1px solid #e2e8f0;
        }
        .email-footer a {
            color: #6d41ca;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="email-container">
            <div class="email-header">
                WOND3R CARD
            </div>
            <div class="email-body">
                <p>Dear {{name}},</p>
                <p>Thank you for choosing to secure your Wond3r Card account by enabling Two-Factor Authentication (2FA). Please use the One-Time Password (OTP) below to complete the setup:</p>
                <div class="otp-code">{{otpCode}}</div>
                <p><strong>Note:</strong> This OTP is valid for the next <strong>10 minutes</strong>. Please do not share it with anyone.</p>
                <p>To enable 2FA:</p>
                <ol>
                    <li>Enter the OTP code on the 2FA setup page.</li>
                    <li>Follow the instructions to complete the process.</li>
                </ol>
                <p>If you did not request this, please contact our support team immediately at <a href="mailto:support@wond3rcard.com">support@wond3rcard.com</a>.</p>
            </div>
            <div class="email-footer">
                &copy; 2025 Wond3r Card. All rights reserved.<br>
                <a href="https://www.wond3rcard.com">www.wond3rcard.com</a> | <a href="mailto:support@wond3rcard.com">Contact Support</a>
            </div>
        </div>
    </div>
</body>
</html>
`,

    enable2FA: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>2FA Enabled Successfully</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }
        .email-header {
            background-color: #6d41ca;
            color: #ffffff;
            padding: 20px;
            text-align: center;
            font-size: 24px;
        }
        .email-body {
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .email-body p {
            margin: 10px 0;
        }
        .success-message {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            background: #f9f9f9;
            padding: 10px;
            margin: 20px 0;
            border: 1px solid #6d41ca;
            color: #6d41ca;
        }
        .email-footer {
            background: #f9f9f9;
            text-align: center;
            padding: 15px;
            font-size: 12px;
            color: #666;
        }
        .email-footer a {
            color: #6d41ca;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            Wond3r Card
        </div>
        <div class="email-body">
            <p>Dear {{name}},</p>
            <p>We are happy to inform you that Two-Factor Authentication (2FA) has been successfully enabled for your Wond3r Card account. Your account is now more secure.</p>
            <div class="success-message">
                2FA Enabled Successfully!
            </div>
            <p>From now on, every time you log in, you'll be prompted to enter a One-Time Password (OTP) sent to your registered device, ensuring an additional layer of protection for your account.</p>
            <p>If you did not authorize this change or have any questions, please contact our support team immediately at <a href="mailto:support@wond3rcard.com">support@wond3rcard.com</a> or call us at +1-800-123-4567.</p>
            <p>Thank you for trusting Wond3r Card to secure your account.</p>
        </div>
        <div class="email-footer">
            &copy; 2025 Wond3r Card. All rights reserved.<br>
            <a href="https://www.wond3rcard.com">www.wond3rcard.com</a> | <a href="mailto:support@wond3rcard.com">Contact Support</a>
        </div>
    </div>
</body>
</html>
`,

    otpCode: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your 2FA OTP Code</title>
    <style>
        body {
            font-family: 'Verdana', sans-serif;
            background-color: #f2f2f2;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .email-header {
            background-color: #6d41ca;
            color: #ffffff;
            text-align: center;
            padding: 20px;
            font-size: 24px;
        }
        .email-body {
            padding: 20px;
            color: #333333;
        }
        .email-body p {
            margin: 15px 0;
        }
        .otp-code {
            display: block;
            font-size: 28px;
            font-weight: bold;
            color: #6d41ca;
            text-align: center;
            margin: 20px 0;
            padding: 10px;
            border: 2px dashed #6d41ca;
            border-radius: 5px;
            background-color: #fff5f0;
        }
        .instructions {
            margin-top: 20px;
            font-size: 14px;
            color: #666;
        }
        .email-footer {
            text-align: center;
            padding: 15px;
            background: #f9f9f9;
            font-size: 12px;
            color: #888888;
        }
        .email-footer a {
            color: #6d41ca;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            Wond3r Card
        </div>
        <div class="email-body">
            <p>Hi {{name}},</p>
            <p>You've requested to enable Two-Factor Authentication (2FA) for your Wond3r Card account. Use the One-Time Password (OTP) below to complete the setup:</p>
            <div class="otp-code">
                {{otpCode}}
            </div>
            <p><strong>Note:</strong> This OTP is valid for <strong>10 minutes</strong>. Please do not share this code with anyone.</p>
            <p class="instructions">
                If you did not request this, please contact our support team immediately at <a href="mailto:support@wond3rcard.com">support@wond3rcard.com</a> or call us at +1-800-123-4567.
            </p>
        </div>
        <div class="email-footer">
            &copy; 2025 Wond3r Card. All rights reserved.<br>
            <a href="https://www.wond3rcard.com">www.wond3rcard.com</a> | <a href="mailto:support@wond3rcard.com">Contact Support</a>
        </div>
    </div>
</body>
</html>
`,

    global2FAEnabled: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>2FA Enabled Notification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f9f9f9; margin: 0; padding: 0;">
  <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd;">
    <tr style="background-color: #6d41ca; color: #ffffff;">
      <td style="padding: 20px; text-align: center;">
        <h1>Wond3r Card</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px;">
        <p>Hi {{name}},</p>
        <p>We're enhancing the security of your account. As part of our commitment to safeguarding your data, Two-Factor Authentication (2FA) has been enabled for your account.</p>
        <p>2FA adds an extra layer of security by requiring a second step to verify your identity. To learn more about how to use 2FA, please visit our <a href="{{supportLink}}" style="color: #6d41ca;">support page</a>.</p>
        <p>If you have any questions or need assistance, feel free to contact us.</p>
        <p>Thank you,<br>The Wond3r Card Team</p>
      </td>
    </tr>
    <tr style="background-color: #f4f4f4; text-align: center;">
      <td style="padding: 10px;">
        <p style="font-size: 12px; color: #555;">Need help? Visit <a href="{{supportLink}}" style="color: #6d41ca;">Support</a> or contact our team.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`,
};

export default MailTemplates;
