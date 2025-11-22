/* instabul ignore file */

import { Heading } from '@/components/heading'
import { SubscriptionButton } from '@/components/subscription-button'
import { checkSubscription } from '@/lib/subscription'
import { Settings } from 'lucide-react'
import React from 'react'

const SettingsPage = async () => {
    const isPro = await checkSubscription();

  return (
    <div>
        <Heading
          title="Settings"
          description="Manage account settings."
          icon={Settings}
          iconColor="text-gray-700"
          bgColor="bg-gray-700/10"
        />
        <div className="px-4 lg:px-8 space-y-6">
            <div className="space-y-4">
                <div className="text-muted-foreground text-sm">
                    {isPro ? "You are currently on a pro plan." : "You are currently on a free plan,"}
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-900 mb-2">Developer Note</h3>
                    <p className="text-blue-800 text-sm mb-3">
                        Heads up, your friendly developer Malcolm here. Stripe is still in test mode therefore the process to upgrade will be simulated.
                    </p>
                    <div className="bg-white p-3 rounded-md text-sm space-y-1.5 text-blue-800">
                        <div className="font-medium mb-2">Please use the following test card details:</div>
                        <div>Card Number: 4444 4444 4444 4444</div>
                        <div>CCV: 444</div>
                        <div>Date of expiry: any future date beyond today</div>
                    </div>
                </div>
                <SubscriptionButton isPro={isPro}/>
            </div>
        </div>
    </div>
  )
}

export default SettingsPage