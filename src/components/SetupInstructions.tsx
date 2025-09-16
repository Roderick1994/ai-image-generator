'use client';

import { useState } from 'react';
import { AlertCircle, ExternalLink, Copy, Check, Settings } from 'lucide-react';

interface SetupInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SetupInstructions({ isOpen, onClose }: SetupInstructionsProps) {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const copyToClipboard = async (text: string, stepNumber: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStep(stepNumber);
      setTimeout(() => setCopiedStep(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Settings className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Setup DOUBAO API Key
                </h2>
                <p className="text-sm text-gray-600">
                  Configure your DOUBAO API key to start generating images
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-orange-800">
                  API Key Required
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  You need a DOUBAO API key to generate images. Follow the steps below to get started.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Create a Volcengine Account
                </h3>
                <p className="text-gray-600 mb-3">
                  If you don&apos;t have a Volcengine account, sign up to access DOUBAO API.
                </p>
                <a
                  href="https://console.volcengine.com/auth/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <span>Sign Up at Volcengine</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Enable ARK Service
                </h3>
                <p className="text-gray-600 mb-3">
                  Enable the ARK service in your Volcengine console to access DOUBAO models.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> You need to enable ARK service and have sufficient balance to use DOUBAO API.
                    </p>
                  </div>
                </div>
                <a
                  href="https://console.volcengine.com/ark"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <span>Enable ARK Service</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Get Your API Key
                </h3>
                <p className="text-gray-600 mb-3">
                  Go to the ARK console and create a new API key for accessing DOUBAO models.
                </p>
                <a
                  href="https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <span>Get API Key</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Create Inference Endpoint
                </h3>
                <p className="text-gray-600 mb-3">
                  Create an inference endpoint for Seedream model in ARK console to get the endpoint ID.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                      <strong>重要:</strong> 豆包图像生成需要使用推理端点ID（以&quot;ep-&quot;开头），而不是模型名称。
                    </p>
                  </div>
                </div>
                <a
                  href="https://console.volcengine.com/ark/region:ark+cn-beijing/endpoint"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  <span>Create Endpoint</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                5
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Configure Environment Variables
                </h3>
                <p className="text-gray-600 mb-3">
                  Open the <code className="bg-gray-100 px-2 py-1 rounded text-sm">.env.local</code> file in your project root and add your API key and endpoint ID.
                </p>
                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Environment Variables:</span>
                    <button
                      onClick={() => copyToClipboard('DOUBAO_API_KEY=your_actual_api_key_here\nDOUBAO_ENDPOINT_ID=ep-your-endpoint-id', 5)}
                      className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      {copiedStep === 5 ? (
                        <><Check className="h-4 w-4" /><span>Copied!</span></>
                      ) : (
                        <><Copy className="h-4 w-4" /><span>Copy</span></>
                      )}
                    </button>
                  </div>
                  <code className="block text-sm text-gray-800 bg-white p-3 rounded border whitespace-pre-line">
                    DOUBAO_API_KEY=your_actual_api_key_here
DOUBAO_ENDPOINT_ID=ep-your-endpoint-id
                  </code>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                6
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Restart Development Server
                </h3>
                <p className="text-gray-600 mb-3">
                  After updating the environment file, restart your development server for the changes to take effect.
                </p>
                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Terminal Command:</span>
                    <button
                      onClick={() => copyToClipboard('npm run dev', 6)}
                      className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      {copiedStep === 6 ? (
                        <><Check className="h-4 w-4" /><span>Copied!</span></>
                      ) : (
                        <><Copy className="h-4 w-4" /><span>Copy</span></>
                      )}
                    </button>
                  </div>
                  <code className="block text-sm text-gray-800 bg-white p-3 rounded border">
                    npm run dev
                  </code>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  You&apos;re All Set!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Once you&apos;ve completed these steps, you&apos;ll be able to generate amazing AI images. The setup only needs to be done once.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <a
              href="https://replicate.com/docs/get-started/nextjs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <span>View Documentation</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}